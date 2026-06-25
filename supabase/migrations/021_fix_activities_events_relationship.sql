-- Add foreign key constraint between activities and events
-- This fixes the "Could not find a relationship" error

-- First, check if any orphaned records exist and clean them up
-- Remove any activities that reference non-existent events
DELETE FROM activities 
WHERE event_id IS NOT NULL 
AND event_id NOT IN (SELECT id FROM events);

-- Add the foreign key constraint
ALTER TABLE activities 
ADD CONSTRAINT fk_activities_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Add an index for better performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_activities_event_id_fk ON activities(event_id);

-- Update the comment to document the relationship
COMMENT ON COLUMN activities.event_id IS 'Foreign key reference to events table - links activity to a specific challenge/event'; 