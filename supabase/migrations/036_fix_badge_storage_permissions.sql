-- Ensure badges storage bucket configuration and achievements columns exist
-- Date: 2025-10-06
-- Description: Fix badge storage RLS policies and guarantee storage metadata columns

-- Ensure the badges bucket exists and remains public
INSERT INTO storage.buckets (id, name, public)
VALUES ('badges', 'badges', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean up legacy badge policies if they exist
DROP POLICY IF EXISTS "Authenticated upload badges" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update badges" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete badges" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on badges" ON storage.objects;

-- Public read access so badge images load without signed URLs
DROP POLICY IF EXISTS "Public read badges" ON storage.objects;
CREATE POLICY "Public read badges"
ON storage.objects FOR SELECT
USING (bucket_id = 'badges');

-- Allow school / super admins to manage badge uploads via app clients
DROP POLICY IF EXISTS "Admins insert badges" ON storage.objects;
CREATE POLICY "Admins insert badges"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Admins update badges" ON storage.objects;
CREATE POLICY "Admins update badges"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Admins delete badges" ON storage.objects;
CREATE POLICY "Admins delete badges"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('school_admin', 'super_admin')
  )
);

-- Ensure achievements has the storage metadata columns used by the app
ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS storage_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS is_custom_upload BOOLEAN DEFAULT false;

-- Backfill default for existing rows (noop if column already existed)
UPDATE achievements
SET is_custom_upload = COALESCE(is_custom_upload, false)
WHERE is_custom_upload IS DISTINCT FROM COALESCE(is_custom_upload, false);

COMMENT ON COLUMN achievements.storage_url IS 'Full public URL to badge image in Supabase storage';
COMMENT ON COLUMN achievements.storage_path IS 'Storage path for badge image in Supabase storage';
COMMENT ON COLUMN achievements.is_custom_upload IS 'True if badge image was uploaded to Supabase storage by an admin';
