
-- =========================================================================
-- 1. Schools: hide sensitive columns from non-admins (column-level privs)
-- =========================================================================
REVOKE SELECT ON public.schools FROM anon, authenticated;
GRANT SELECT (
  id, created_at, updated_at, name, code, total_students, total_kilometers,
  total_points, is_active, is_internal, region, school_type, status,
  self_registered, approved_at, current_term_id, term_points, join_link_active
) ON public.schools TO authenticated;
GRANT SELECT (
  id, name, code, is_active, region, school_type, status
) ON public.schools TO anon;
GRANT ALL ON public.schools TO service_role;

-- =========================================================================
-- 2. Role immutability trigger (blocks self/admin role escalation)
-- =========================================================================
DROP TRIGGER IF EXISTS trg_prevent_privileged_column_changes ON public.users;
CREATE TRIGGER trg_prevent_privileged_column_changes
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_column_changes();

-- Tighten school-admin update WITH CHECK: cannot change role or school_id
DROP POLICY IF EXISTS users_update_school_admin ON public.users;
CREATE POLICY users_update_school_admin ON public.users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users admin
      WHERE admin.id = auth.uid()
        AND admin.role::text = 'school_admin'
        AND admin.school_id = users.school_id
        AND admin.id <> users.id
        AND users.role::text = 'student')
  )
  WITH CHECK (role::text = 'student');

-- =========================================================================
-- 3. Blocked emails: drop overly-broad admin policy (school-scoped one remains)
-- =========================================================================
DROP POLICY IF EXISTS "Admins can manage blocked emails" ON public.blocked_emails;

-- =========================================================================
-- 4. School messages: sender + admins only
-- =========================================================================
DROP POLICY IF EXISTS "Users see own school messages" ON public.school_messages;
CREATE POLICY "Sender and admins read school messages" ON public.school_messages
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (u.role::text = 'super_admin'
             OR (u.role::text = 'school_admin' AND u.school_id = school_messages.school_id)))
  );

-- =========================================================================
-- 5. Storage: restrict writes on event-images & school-updates to admins;
--    drop redundant broad public-listing SELECT policies (buckets are public
--    so files remain accessible via CDN URLs without a SELECT policy).
-- =========================================================================
DROP POLICY IF EXISTS "Authenticated can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;

CREATE POLICY "Admins manage event images" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'event-images'
    AND EXISTS (SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('school_admin','super_admin'))
  )
  WITH CHECK (
    bucket_id = 'event-images'
    AND EXISTS (SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('school_admin','super_admin'))
  );

DROP POLICY IF EXISTS "Authenticated users can upload school update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update school update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete school update images" ON storage.objects;
DROP POLICY IF EXISTS "School update images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view school updates" ON storage.objects;

CREATE POLICY "Admins manage school update images" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'school-updates'
    AND EXISTS (SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('school_admin','super_admin'))
  )
  WITH CHECK (
    bucket_id = 'school-updates'
    AND EXISTS (SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role::text IN ('school_admin','super_admin'))
  );

-- Drop broad public-listing SELECT on badges (public bucket serves via CDN)
DROP POLICY IF EXISTS "Anyone can view badges" ON storage.objects;
DROP POLICY IF EXISTS "badges_read" ON storage.objects;

-- =========================================================================
-- 6. Activities: remove always-true WITH CHECK
-- =========================================================================
DROP POLICY IF EXISTS "School admins can reject activities" ON public.activities;
CREATE POLICY "School admins can reject activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users me
      WHERE me.id = auth.uid()
        AND me.role::text IN ('super_admin','school_admin')
        AND (me.role::text = 'super_admin'
             OR EXISTS (SELECT 1 FROM public.users owner
                WHERE owner.id = activities.user_id
                  AND owner.school_id = me.school_id)))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users me
      WHERE me.id = auth.uid()
        AND me.role::text IN ('super_admin','school_admin')
        AND (me.role::text = 'super_admin'
             OR EXISTS (SELECT 1 FROM public.users owner
                WHERE owner.id = activities.user_id
                  AND owner.school_id = me.school_id)))
  );

-- =========================================================================
-- 7. SECURITY DEFINER functions: revoke EXECUTE from anon (keep signup-flow
--    functions callable), and from authenticated on trigger-only functions.
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.get_school_join_code(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_term_points(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_term_points(text, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_rankings(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_feed_like(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_all_rankings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_house_points() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_school_points() FROM anon;
REVOKE EXECUTE ON FUNCTION public.hard_delete_school(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_delete_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_activity_type_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_unpublish_stale_events() FROM anon, authenticated;

-- Trigger-only functions: revoke from both anon and authenticated
REVOKE EXECUTE ON FUNCTION public.prevent_privileged_column_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_aggregates_on_user_soft_delete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_auth_metadata() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_house_totals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_school_totals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_totals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_house_totals_from_house(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_school_totals_from_school(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.link_allowed_email_on_register() FROM anon, authenticated;
