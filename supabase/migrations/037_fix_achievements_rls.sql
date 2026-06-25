-- Ensure achievements table RLS permits admin management
-- Date: 2025-10-06
-- Description: Allow school/super admins (and service role) to insert/update/delete achievements

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Clean up legacy management policies if present
DROP POLICY IF EXISTS "Insert achievements" ON achievements;
DROP POLICY IF EXISTS "Update achievements" ON achievements;
DROP POLICY IF EXISTS "Delete achievements" ON achievements;
DROP POLICY IF EXISTS "Admins manage achievements" ON achievements;

CREATE POLICY "Admins insert achievements"
ON achievements FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
);

CREATE POLICY "Admins update achievements"
ON achievements FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
);

CREATE POLICY "Admins delete achievements"
ON achievements FOR DELETE
USING (
  auth.role() = 'service_role'
  OR auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
);
