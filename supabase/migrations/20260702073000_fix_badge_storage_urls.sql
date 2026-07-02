-- Fix achievements: point image_filename to PNGs and set storage_url from Supabase bucket
-- The badges bucket public URL base
-- Replace image_filename references (old SVGs / missing files) with the correct PNG filename

-- First, ensure all achievements without storage_url get one from their image_filename or name
UPDATE achievements
SET image_filename = CASE
  WHEN image_filename IS NULL OR image_filename = '' THEN LOWER(REPLACE(name, ' ', '-')) || '.png'
  WHEN image_filename ILIKE '%.svg' THEN REPLACE(image_filename, '.svg', '.png')
  ELSE image_filename
END,
storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/' || 
  CASE
    WHEN image_filename IS NULL OR image_filename = '' THEN LOWER(REPLACE(name, ' ', '-')) || '.png'
    WHEN image_filename ILIKE '%.svg' THEN REPLACE(image_filename, '.svg', '.png')
    ELSE image_filename
  END,
storage_path = 'badges/' || 
  CASE
    WHEN image_filename IS NULL OR image_filename = '' THEN LOWER(REPLACE(name, ' ', '-')) || '.png'
    WHEN image_filename ILIKE '%.svg' THEN REPLACE(image_filename, '.svg', '.png')
    ELSE image_filename
  END,
is_custom_upload = true
WHERE storage_url IS NULL OR storage_url = '';

-- Verify the update
SELECT name, image_filename, storage_url FROM achievements ORDER BY name;
