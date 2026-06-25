-- Add input_type field to activities table
ALTER TABLE activities 
ADD COLUMN input_type VARCHAR(20) NOT NULL DEFAULT 'manual' 
CHECK (input_type IN ('manual', 'device_sync', 'api_import', 'bulk_upload'));

-- Update existing records to have 'manual' as input_type
UPDATE activities SET input_type = 'manual' WHERE input_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN activities.input_type IS 'Method used to input the activity data';