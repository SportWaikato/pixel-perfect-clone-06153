
-- 1. Activities: drop permissive true policies, add scoped read
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;
DROP POLICY IF EXISTS "activities_read" ON public.activities;

CREATE POLICY "activities_read_same_school"
ON public.activities
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.current_user_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.users owner
    WHERE owner.id = activities.user_id
      AND owner.school_id IS NOT NULL
      AND owner.school_id = public.current_user_school_id()
  )
);

-- 2. House achievements: drop the "anyone" policy, keep house_achievements_school_read
DROP POLICY IF EXISTS "Anyone can read house achievements" ON public.house_achievements;

-- 3. Users: drop broad authenticated policies, keep users_select_same_school
DROP POLICY IF EXISTS "Users readable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "users_read" ON public.users;

-- 4. Lock down SECURITY DEFINER functions: revoke from PUBLIC, then grant minimally
REVOKE EXECUTE ON FUNCTION public.accept_super_admin_invite(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_unpublish_stale_events() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_activity_type_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_school_join_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_super_admin_invite(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_term_points(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_rankings(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_delete_school(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_delete_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_feed_like(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_email_allowed(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_school_by_join_code(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_all_rankings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_house_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_school_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_term_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_house_totals_from_house(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_school_totals_from_school(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.use_super_admin_invite(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_school_id() FROM PUBLIC, anon;

-- Re-grant only to roles that actually need to call each function

-- Public/anon flows: signup, join-by-code, invite landing page
GRANT EXECUTE ON FUNCTION public.lookup_school_by_join_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_super_admin_invite(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(uuid, text) TO anon, authenticated;

-- Authenticated user flows
GRANT EXECUTE ON FUNCTION public.increment_feed_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rankings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_term_points(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_join_code(uuid) TO authenticated;

-- RLS helper functions (used inside policies)
GRANT EXECUTE ON FUNCTION public.current_user_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_school_id() TO authenticated;

-- Admin-only operations invoked from client via authenticated session
GRANT EXECUTE ON FUNCTION public.recalculate_house_points() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_school_points() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_term_points(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hard_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hard_delete_school(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_type_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_house_totals_from_house(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_school_totals_from_school(uuid) TO authenticated;

-- service_role retains full access on all functions by default; nothing extra needed for server admin calls.
