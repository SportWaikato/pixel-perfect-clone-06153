-- Migration: Update feeling field constraint to include extended values
-- Date: 2025-01-27
-- Description: Updates the feeling constraint to allow very_sad and very_happy values

-- Drop the existing check constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_feeling_check;

-- Add new constraint with extended feeling values
ALTER TABLE activities ADD CONSTRAINT activities_feeling_check 
CHECK (feeling IN ('very_sad', 'sad', 'average', 'happy', 'very_happy'));

-- Update column comment to reflect the new options
COMMENT ON COLUMN activities.feeling IS 'How the user felt during the activity: very_sad, sad, average, happy, very_happy'; 