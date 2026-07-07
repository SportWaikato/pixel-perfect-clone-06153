-- =========================================================================
-- Karawhiua Security Posture Verification Script
-- Run in Supabase SQL Editor against production to confirm security controls.
-- =========================================================================

-- 1. users SELECT policy: should include users_select_same_school
-- Expected: 1 row with policyname = 'users_select_same_school'
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname = 'users_select_same_school';

-- 2. Role self-insert trigger: prevents unauthorised role elevation
-- Expected: 1 row with tgname = 'trg_enforce_role_on_self_insert'
SELECT t.tgname, c.relname AS table_name, n.nspname AS schema_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'users'
  AND t.tgname = 'trg_enforce_role_on_self_insert'
  AND NOT t.tgisinternal;

-- 3. school-updates storage policies: only admins may write/update/delete
-- Expected: 3 rows (Admins upload/update/delete school update images)
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'Admins manage school update images'
  );

-- 4. Helper functions: current_user_school_id() and current_user_is_super_admin()
-- Expected: 1 row each, with proseCDef = true (SECURITY DEFINER)
SELECT p.oid::regprocedure AS func,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('current_user_school_id', 'current_user_is_super_admin');

-- 5. Atomic invite acceptance: accept_super_admin_invite exists and is service_role only
-- Expected: 1 row with security_definer = true
SELECT p.oid::regprocedure AS func,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'accept_super_admin_invite';

-- 6. Invite RPC grants: accept_super_admin_invite and use_super_admin_invite
--    should be service_role only; get_super_admin_invite should have anon access
-- Expected: service_role has execute on accept_* and use_*; anon has on get_*
SELECT grantee, routine_name
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'accept_super_admin_invite',
    'use_super_admin_invite',
    'get_super_admin_invite'
  )
ORDER BY routine_name, grantee;

-- 7. get_user_emails_by_ids: should only be executable by service_role
-- Expected: 1 row with grantee = 'service_role'
SELECT grantee, routine_name
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_user_emails_by_ids';
