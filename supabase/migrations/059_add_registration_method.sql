-- Add registration_method to schools and create blocked_emails table

-- 1. Add registration_method column (default to domain_blocklist for open schools)
ALTER TABLE schools
  ADD COLUMN registration_method TEXT NOT NULL DEFAULT 'domain_blocklist'
  CHECK (registration_method IN ('domain_blocklist', 'allowlist'));

-- 2. Migrate existing data from allow_list_enabled
UPDATE schools SET registration_method = 'allowlist' WHERE allow_list_enabled = true;
UPDATE schools SET registration_method = 'domain_blocklist' WHERE allow_list_enabled = false;

-- 3. Drop superseded column and RPC
ALTER TABLE schools DROP COLUMN allow_list_enabled;
DROP FUNCTION IF EXISTS set_allow_list_enabled(UUID, BOOLEAN);

-- 4. Create blocked_emails table
CREATE TABLE blocked_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(school_id, email)
);

-- 5. RLS for blocked_emails
ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_admins_manage_blocked_emails" ON blocked_emails
  FOR ALL TO authenticated
  USING (
    school_id IN (SELECT school_id FROM school_admins WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    school_id IN (SELECT school_id FROM school_admins WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 6. Update is_email_allowed RPC to support both methods
CREATE OR REPLACE FUNCTION is_email_allowed(p_school_id UUID, p_email TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_method TEXT;
BEGIN
  SELECT registration_method INTO v_method FROM schools WHERE id = p_school_id;

  IF v_method = 'domain_blocklist' THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM blocked_emails
      WHERE school_id = p_school_id AND LOWER(email) = LOWER(p_email)
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM allowed_emails
      WHERE school_id = p_school_id AND LOWER(email) = LOWER(p_email)
    );
  END IF;
END;
$$;
