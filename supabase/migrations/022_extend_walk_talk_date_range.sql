-- Migration: Extend Walk and Talk achievement date range for testing
-- Date: 2025-08-04
-- Description: Updates the Walk and Talk achievement date range to allow for current testing

-- Update Walk and Talk achievement to extend date range through August 2025
UPDATE achievements 
SET criteria = jsonb_set(
  criteria, 
  '{date_range}', 
  '{"start": "2025-07-21", "end": "2025-08-31"}'::jsonb
)
WHERE name = 'Walk and Talk'
  AND criteria->>'type' = 'walk_and_talk';

-- Verify the update was successful
-- This should show the updated date range
-- SELECT name, criteria->'date_range' as date_range 
-- FROM achievements 
-- WHERE name = 'Walk and Talk';