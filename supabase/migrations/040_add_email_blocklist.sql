-- Migration: Add email block list for schools
-- School admins can block specific student email addresses from registering.
-- When an email is blocked, any existing user with that email at the school
-- is automatically deactivated.

CREATE TABLE blocked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(school_id, email)
);

COMMENT ON TABLE blocked_emails IS 'Emails blocked from registering at a school. Existing users with these emails are deactivated.';

-- Indexes
CREATE INDEX idx_blocked_emails_school_id ON blocked_emails(school_id);
CREATE INDEX idx_blocked_emails_email ON blocked_emails(LOWER(email));

-- RLS
ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;

-- School admins can manage their own school's block list
CREATE POLICY "School admins manage their block list" ON blocked_emails
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('school_admin', 'super_admin')
        AND (users.school_id = blocked_emails.school_id OR users.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('school_admin', 'super_admin')
        AND (users.school_id = blocked_emails.school_id OR users.role = 'super_admin')
    )
  );

-- Trigger: deactivate any existing user at the school when their email is blocked
CREATE OR REPLACE FUNCTION deactivate_blocked_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET is_active = false, updated_at = NOW()
  WHERE school_id = NEW.school_id
    AND id IN (
      SELECT id FROM auth.users
      WHERE LOWER(email) = LOWER(NEW.email)
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_email_blocked
  AFTER INSERT ON blocked_emails
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_blocked_users();

-- RPC: safe check usable during signup (before the user is authenticated)
-- Returns true if the given email is on the block list for the given school.
CREATE OR REPLACE FUNCTION is_email_blocked(p_school_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_emails
    WHERE school_id = p_school_id
      AND LOWER(email) = LOWER(p_email)
  );
END;
$$;
