
-- 1. user_achievements: remove open INSERT to public
DROP POLICY IF EXISTS "System can insert user achievements" ON public.user_achievements;

-- 2. users: fix broken WITH CHECK in school_admin_update_students
DROP POLICY IF EXISTS school_admin_update_students ON public.users;
CREATE POLICY school_admin_update_students ON public.users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.school_admins sa
      WHERE sa.user_id = auth.uid() AND sa.school_id = users.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.school_admins sa
      WHERE sa.user_id = auth.uid() AND sa.school_id = users.school_id
    )
  );

-- 2b. Prevent any non-super-admin from changing role or school_id (defense in depth
-- against permissive UPDATE policies on users, including users_update_own_safe,
-- School admins can update their school users, and Users can view their own data ALL).
CREATE OR REPLACE FUNCTION public.prevent_privileged_column_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role text;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.school_id IS DISTINCT FROM OLD.school_id THEN
    SELECT u.role::text INTO actor_role FROM public.users u WHERE u.id = auth.uid();
    IF COALESCE(actor_role, '') <> 'super_admin' THEN
      RAISE EXCEPTION 'Only super admins can change role or school_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privileged_column_changes ON public.users;
CREATE TRIGGER trg_prevent_privileged_column_changes
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_column_changes();

-- 3. schools: stop exposing join_code / email domain / rejection_reason to anon
DROP POLICY IF EXISTS "Users can view schools" ON public.schools;
REVOKE SELECT ON public.schools FROM anon;
GRANT SELECT (
  id, created_at, updated_at, name, code, total_students, total_kilometers,
  is_active, total_points, is_internal, current_term_id, region, school_type,
  status, self_registered, approved_at
) ON public.schools TO anon;

-- 4. house_achievements: enable RLS and add scoped policies
ALTER TABLE public.house_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS house_achievements_school_read ON public.house_achievements;
CREATE POLICY house_achievements_school_read ON public.house_achievements
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT u.school_id FROM public.users u WHERE u.id = auth.uid()));

DROP POLICY IF EXISTS house_achievements_admin_write ON public.house_achievements;
CREATE POLICY house_achievements_admin_write ON public.house_achievements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('school_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('school_admin', 'super_admin')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.house_achievements TO authenticated;
GRANT ALL ON public.house_achievements TO service_role;

-- 5. Revoke public EXECUTE on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.hard_delete_school(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_delete_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_auth_metadata() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_house_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_house_totals_from_house(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_school_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_school_totals_from_school(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_unpublish_stale_events() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_allowed_email_on_register() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_activity_type_counts() FROM PUBLIC, anon;

-- 6. Set fixed search_path on the three functions missing it
ALTER FUNCTION public.recalculate_school_points() SET search_path = public;
ALTER FUNCTION public.recalculate_all_rankings() SET search_path = public;
ALTER FUNCTION public.recalculate_house_points() SET search_path = public;

-- 7. Restrict authenticated storage listing to buckets the user owns objects in
-- (public bucket CDN reads keep working; broad listing does not).
DROP POLICY IF EXISTS storage_read_authenticated ON storage.objects;
CREATE POLICY storage_read_authenticated ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('challenge-media','promotional-assets','badges','assets')
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role::text IN ('school_admin','super_admin')
      )
    )
  );
