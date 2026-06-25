-- Migration: Add is_internal flag to schools table
-- Purpose: Allow Sport Waikato test schools to be hidden from public leaderboards
-- Date: 2025-01-09

-- Step 1: Add the is_internal column to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_schools_is_internal ON schools(is_internal);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN schools.is_internal IS 'Flag to identify internal test schools used by Sport Waikato. Internal schools are hidden from public leaderboards but can see each other.';

-- Step 4: Update trigger function to handle internal schools in totals calculation
-- The existing update_school_totals function doesn't need modification as it already works correctly

-- Step 5: Example marking of test schools as internal (uncomment and modify as needed)
-- UPDATE schools SET is_internal = true WHERE code IN ('SWTS', 'TEST1', 'TEST2');
-- Or mark specific schools:
-- UPDATE schools SET is_internal = true WHERE name LIKE '%Test%' OR name LIKE '%Demo%';