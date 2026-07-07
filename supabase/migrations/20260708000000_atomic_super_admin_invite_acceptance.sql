-- Migration: Atomic super-admin invite acceptance + tighten invite RPC grants
--
-- Replaces the two-step "insert profile then separately mark invite as used"
-- with a single transactional RPC that validates the invite, inserts the
-- profile row, and marks the invite as used atomically.
--
-- Also revokes direct execute on use_super_admin_invite from anon/authenticated
-- since it is now only called via the service_role inside the new
-- accept_super_admin_invite server function.

-- 1. Create atomic invite acceptance function (service_role only)
CREATE OR REPLACE FUNCTION public.accept_super_admin_invite(
  p_token      UUID,
  p_email      TEXT,
  p_username   TEXT,
  p_first_name TEXT,
  p_last_name  TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id    UUID;
  v_user_id      UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate invite
  SELECT id INTO v_invite_id
  FROM super_admin_invites
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW()
    AND lower(email) = lower(p_email)
  FOR UPDATE;

  IF v_invite_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Insert the users profile row (role = super_admin)
  INSERT INTO users (
    id,
    username,
    first_name,
    last_name,
    role,
    is_admin,
    is_public,
    total_kilometers,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_username,
    p_first_name,
    p_last_name,
    'super_admin',
    TRUE,
    TRUE,
    0,
    NOW(),
    NOW()
  );

  -- Mark invite as used
  UPDATE super_admin_invites
  SET used_at = NOW(),
      used_by = v_user_id
  WHERE id = v_invite_id;

  RETURN TRUE;
END;
$$;

-- Only the service_role should call this (it does profile insertion + invite
-- marking atomically, bypassing RLS for the users insert).
REVOKE EXECUTE ON FUNCTION public.accept_super_admin_invite(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.accept_super_admin_invite(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 2. Revoke direct access to old invite RPCs from anon/authenticated.
--    get_super_admin_invite is still needed for the public /invite/$token page
--    to check invite validity, so we keep its anon grant.
--    use_super_admin_invite is now superceded by accept_super_admin_invite and
--    should only be callable by service_role.
REVOKE EXECUTE ON FUNCTION public.use_super_admin_invite(UUID, UUID) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.use_super_admin_invite(UUID, UUID) TO service_role;

-- 3. Verification queries (run these to confirm)

-- Check the new function exists and is only executable by service_role
SELECT p.oid::regprocedure AS func,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('accept_super_admin_invite', 'use_super_admin_invite', 'get_super_admin_invite');

-- Check grants on invite functions (should show only service_role has execute
-- on accept_super_admin_invite and use_super_admin_invite)
SELECT grantee, routine_name
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('accept_super_admin_invite', 'use_super_admin_invite', 'get_super_admin_invite')
ORDER BY routine_name, grantee;
