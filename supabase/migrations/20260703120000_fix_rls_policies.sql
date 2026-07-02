-- Fix RLS Policies — restrict public access to authenticated users
-- Date: 2026-07-03
-- Applied after: 20260702080000_map_all_badges.sql
-- 
-- Changes:
--   1. user_achievements: replace open INSERT WITH CHECK (true) with service-role-only insert
--   2. users: restrict "view other users" to authenticated only
--   3. activities: restrict "view all activities" to authenticated only
--   4. events: restrict "view events" to authenticated only
--   5. achievements: restrict "anyone can view achievements" to authenticated only
--   6. Revoke remaining EXECUTE on sensitive SECURITY DEFINER functions
--   7. Drop any lingering GRANT SELECT on core tables to anon (follow-up to 20260702072116)

-- 1. user_achievements: proper insert policy
-- (20260702072116 already DROPped the old open one; this adds a safe replacement)
DROP POLICY IF EXISTS "System can insert user achievements" ON public.user_achievements;

-- Allow service_role to insert achievements (the automated awarding system)
CREATE POLICY "Service role can insert achievements" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'service_role');

-- Also allow the check-achievements edge function (runs via service role)
-- and admins to manually award achievements
CREATE POLICY "Admins can award achievements" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('super_admin', 'school_admin')
    )
  );

-- 2. users: restrict "view other users" to authenticated only
DROP POLICY IF EXISTS "Users can view other users" ON public.users;
CREATE POLICY "Users can view other users" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- 3. activities: restrict "view all activities" to authenticated only
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;
CREATE POLICY "Users can view all activities" ON public.activities
  FOR SELECT TO authenticated
  USING (true);

-- 4. events: restrict "view events" to authenticated only
DROP POLICY IF EXISTS "Users can view events" ON public.events;
CREATE POLICY "Users can view events" ON public.events
  FOR SELECT TO authenticated
  USING (true);

-- 5. achievements: restrict "anyone can view achievements" to authenticated only
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT TO authenticated
  USING (true);

-- 6. Revoke remaining EXECUTE on sensitive SECURITY DEFINER functions
-- Some of these may already be revoked by 20260702072116, but the REVOKE is idempotent
REVOKE EXECUTE ON FUNCTION public.prevent_privileged_column_changes() FROM PUBLIC, anon, authenticated;

-- Wrapped in DO blocks so migration doesn't fail if function doesn't exist on this project
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_user_login() FROM PUBLIC, anon;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.delete_user(uuid) FROM PUBLIC, anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- 7. Explicitly revoke anon SELECT on core tables (defence in depth)
-- The migration 20260702072116 already did this for schools with a column-restricted GRANT.
-- Ensure other tables are not grant-accessible to anon.
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.activities FROM anon;
REVOKE SELECT ON public.events FROM anon;
REVOKE SELECT ON public.achievements FROM anon;
REVOKE SELECT ON public.user_achievements FROM anon;

-- Note: schools keeps the column-restricted GRANT from 20260702072116:
--   GRANT SELECT (id, created_at, updated_at, name, code, total_students, ...) ON public.schools TO anon;
-- This is intentional — the register page needs to look up school names without being logged in.
