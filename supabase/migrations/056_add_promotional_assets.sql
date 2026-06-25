-- Add promotional assets for school admin downloads
-- Super admins manage assets; school admins can browse and download

-- Create the promotional-assets storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('promotional-assets', 'promotional-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies
CREATE POLICY "Public read promotional-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotional-assets');

CREATE POLICY "Super admins insert promotional-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promotional-assets'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'super_admin'
  )
);

CREATE POLICY "Super admins update promotional-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'promotional-assets'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'super_admin'
  )
)
WITH CHECK (
  bucket_id = 'promotional-assets'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'super_admin'
  )
);

CREATE POLICY "Super admins delete promotional-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'promotional-assets'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'super_admin'
  )
);

-- Create the promotional_assets table
CREATE TABLE promotional_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  file_url    TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_type   TEXT NOT NULL,
  file_size   BIGINT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE promotional_assets ENABLE ROW LEVEL SECURITY;

-- Super admins: full CRUD
CREATE POLICY "Super admins manage promotional_assets"
ON promotional_assets
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
);

-- School admins and students: read active assets only
CREATE POLICY "Authenticated users read active promotional_assets"
ON promotional_assets
FOR SELECT
USING (
  is_active = true
  AND auth.uid() IN (SELECT id FROM public.users WHERE is_active = true)
);
