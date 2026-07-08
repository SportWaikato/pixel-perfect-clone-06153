
DROP POLICY IF EXISTS "Users can view events" ON public.events;

CREATE POLICY "Authenticated users can view relevant events"
ON public.events
FOR SELECT
TO authenticated
USING (
  -- Published & approved events visible to users in target schools (or global)
  (
    COALESCE(is_published, false) = true
    AND COALESCE(approval_status, 'approved') = 'approved'
    AND (
      target_schools IS NULL
      OR cardinality(target_schools) = 0
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.school_id = ANY (events.target_schools)
      )
    )
  )
  -- Creators can see their own events (pending suggestions, drafts)
  OR created_by = auth.uid()
  -- School admins can see events for their school
  OR EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND (
        events.target_schools IS NULL
        OR cardinality(events.target_schools) = 0
        OR u.school_id = ANY (events.target_schools)
      )
  )
  -- Super admins see everything
  OR EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
);
