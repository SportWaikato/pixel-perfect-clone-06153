-- Add image support to school_updates
ALTER TABLE school_updates
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Create storage bucket for school update images
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-updates', 'school-updates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "School update images are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'school-updates');

CREATE POLICY "Authenticated users can upload school update images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-updates');

CREATE POLICY "Authenticated users can update school update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-updates');

CREATE POLICY "Authenticated users can delete school update images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-updates');
