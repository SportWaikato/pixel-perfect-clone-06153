-- Create badges storage bucket and add Supabase storage support to achievements
-- Date: 2025-01-11
-- Description: Add Supabase storage support for badge images while maintaining backward compatibility

-- Create badges storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('badges', 'badges', true) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to badges
CREATE POLICY "Public read access on badges" ON storage.objects FOR SELECT USING (bucket_id = 'badges');

-- Allow authenticated users to upload badges (admin only, enforced at app level)
CREATE POLICY "Authenticated upload badges" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'badges' AND auth.role() = 'authenticated');

-- Allow authenticated users to update badges (admin only, enforced at app level)
CREATE POLICY "Authenticated update badges" ON storage.objects FOR UPDATE USING (bucket_id = 'badges' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete badges (admin only, enforced at app level)
CREATE POLICY "Authenticated delete badges" ON storage.objects FOR DELETE USING (bucket_id = 'badges' AND auth.role() = 'authenticated');

-- Add new fields to achievements table for Supabase storage support
ALTER TABLE achievements 
ADD COLUMN storage_url TEXT,
ADD COLUMN storage_path TEXT,
ADD COLUMN is_custom_upload BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN achievements.storage_url IS 'Full public URL to badge image in Supabase storage';
COMMENT ON COLUMN achievements.storage_path IS 'Storage path for badge image in Supabase storage';
COMMENT ON COLUMN achievements.is_custom_upload IS 'True if badge was uploaded via admin interface (vs default public folder)';