-- Scope users SELECT to same-school (was USING (true) for all authenticated).
--
-- 20260703120000 already restricted the policy from anon to authenticated, but
-- any signed-in student could still enumerate every student across every
-- school (children's names, school, house, year group). This scopes reads to:
--   * your own row
--   * users in your own school
--   * super admins see everyone
--
-- Cross-school reads (e.g. global leaderboards) must NOT rely on direct
-- selects from public.users — use SECURITY DEFINER RPCs (get_user_rankings
-- already is one, see migration 049).
--
-- The helpers are SECURITY DEFINER to avoid RLS recursion (a users policy
-- cannot subquery users directly).

CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'super_admin'
  )
$$;

-- 20260702234741 revoked EXECUTE on all SECURITY DEFINER functions from
-- authenticated; these two are policy helpers and must be callable during
-- RLS evaluation by signed-in users.
REVOKE EXECUTE ON FUNCTION public.current_user_school_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Users can view other users" ON public.users;

CREATE POLICY users_select_same_school ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.current_user_is_super_admin()
    OR (school_id IS NOT NULL AND school_id = public.current_user_school_id())
  );
