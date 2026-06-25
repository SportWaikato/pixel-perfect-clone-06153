-- Migration 051: Add allow_list_enabled flag to schools
--
-- When FALSE (default): open registration — anyone with a valid school email can register.
-- When TRUE: restricted — only emails on the allowed_emails list can register.
--
-- This replaces the previous empty-list = open heuristic with an explicit flag.

ALTER TABLE schools ADD COLUMN allow_list_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN schools.allow_list_enabled IS
  'When true, only emails on the allowed_emails list can register. '
  'When false (default), registration is open to anyone with a valid school email.';

-- Update is_email_allowed to check the flag instead of the empty-list heuristic
CREATE OR REPLACE FUNCTION is_email_allowed(p_school_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If allow list is not enabled for this school, allow all
  IF NOT (SELECT COALESCE(allow_list_enabled, FALSE) FROM schools WHERE id = p_school_id) THEN
    RETURN TRUE;
  END IF;

  -- Allow list is active: email must be present
  RETURN EXISTS (
    SELECT 1 FROM allowed_emails
    WHERE school_id = p_school_id
      AND LOWER(email) = LOWER(p_email)
  );
END;
$$;

-- RPC to toggle allow_list_enabled, callable by school admins and super admins
CREATE OR REPLACE FUNCTION set_allow_list_enabled(p_school_id UUID, p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('school_admin', 'super_admin')
      AND (school_id = p_school_id OR role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE schools SET allow_list_enabled = p_enabled WHERE id = p_school_id;
END;
$$;
