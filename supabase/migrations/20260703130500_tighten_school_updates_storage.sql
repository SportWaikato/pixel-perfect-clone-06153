-- Tighten the 'school-updates' storage bucket (created in 081).
--
-- Previously ANY authenticated user (i.e. any student) could upload, replace,
-- or delete school update images. Writes are now limited to school_admin /
-- super_admin. Public read stays — the bucket is public and images are
-- embedded in school update posts.

DROP POLICY IF EXISTS "Authenticated users can upload school update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update school update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete school update images" ON storage.objects;

CREATE POLICY "Admins upload school update images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'school-updates'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role::text IN ('school_admin', 'super_admin')
    )
  );

CREATE POLICY "Admins update school update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'school-updates'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role::text IN ('school_admin', 'super_admin')
    )
  );

CREATE POLICY "Admins delete school update images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'school-updates'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role::text IN ('school_admin', 'super_admin')
    )
  );
