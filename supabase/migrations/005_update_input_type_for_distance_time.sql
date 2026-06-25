-- Migration: Update input_type column to support distance/time input modes
-- This changes the input_type from data source tracking to input method tracking

-- First, drop the existing constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_input_type_check;

-- Update existing records to use 'distance' as default (since all current entries are distance-based)
UPDATE activities SET input_type = 'distance' WHERE input_type IN ('manual', 'device_sync', 'api_import', 'bulk_upload');

-- Add new constraint for distance/time input types
ALTER TABLE activities ADD CONSTRAINT activities_input_type_check 
CHECK (input_type IN ('distance', 'time'));

-- Update column comment
COMMENT ON COLUMN activities.input_type IS 'Input method: distance (direct distance entry) or time (time-based calculation)';