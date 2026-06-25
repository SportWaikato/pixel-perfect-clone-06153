-- Migration 050: Replace email block list with email allow list
--
-- Behavior:
--   • If a school has 0 rows in allowed_emails → open registration (allowlist inactive)
--   • If a school has 1+ rows → only listed emails may register
--   • user_id is populated by a trigger when a matching user registers
--   • ON DELETE SET NULL on user_id means removing a user account returns the row to Pending

-- ============================================================
-- 1. Drop old objects from migration 040
-- ============================================================

DROP TRIGGER IF EXISTS on_email_blocked ON blocked_emails;
DROP FUNCTION IF EXISTS deactivate_blocked_users();
DROP FUNCTION IF EXISTS is_email_blocked(UUID, TEXT);
DROP TABLE IF EXISTS blocked_emails;

-- ============================================================
-- 2. Create allowed_emails table
-- ============================================================

CREATE TABLE allowed_emails (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  note        TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(school_id, email)
);

COMMENT ON TABLE allowed_emails IS
  'Emails permitted to register at a school. Empty list = open registration. '
  'user_id is populated when the matching user registers.';

COMMENT ON COLUMN allowed_emails.note IS
  'Optional admin note (e.g. student name, class).';

COMMENT ON COLUMN allowed_emails.user_id IS
  'Populated when a user with this email registers at this school. '
  'NULL = pending (not yet registered). SET NULL on user deletion.';

-- ============================================================
-- 3. Indexes
-- ============================================================

CREATE INDEX idx_allowed_emails_school_id ON allowed_emails(school_id);
CREATE INDEX idx_allowed_emails_email     ON allowed_emails(LOWER(email));
CREATE INDEX idx_allowed_emails_user_id   ON allowed_emails(user_id);

-- ============================================================
-- 4. RLS
-- ============================================================

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage their allow list" ON allowed_emails
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('school_admin', 'super_admin')
        AND (users.school_id = allowed_emails.school_id OR users.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('school_admin', 'super_admin')
        AND (users.school_id = allowed_emails.school_id OR users.role = 'super_admin')
    )
  );

-- ============================================================
-- 5. Trigger: link user_id when a new user registers
-- ============================================================
-- Fires AFTER INSERT on users. Uses SECURITY DEFINER to read
-- auth.users and resolve the registering user's email.

CREATE OR REPLACE FUNCTION link_allowed_email_on_register()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT LOWER(email) INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  IF v_email IS NOT NULL THEN
    UPDATE allowed_emails
    SET user_id = NEW.id
    WHERE school_id = NEW.school_id
      AND LOWER(email) = v_email
      AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_registered
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION link_allowed_email_on_register();

-- ============================================================
-- 6. RPC: is_email_allowed — called during signup before auth
-- ============================================================
-- Returns TRUE if registration is permitted.
-- Empty list = open (true). Non-empty list = email must be present.

CREATE OR REPLACE FUNCTION is_email_allowed(p_school_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    (SELECT COUNT(*) FROM allowed_emails WHERE school_id = p_school_id) = 0
    OR
    EXISTS (
      SELECT 1 FROM allowed_emails
      WHERE school_id = p_school_id
        AND LOWER(email) = LOWER(p_email)
    )
  );
END;
$$;
