-- Add new fields to events table for approval system (only if they don't exist)
DO $$ 
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'created_by') THEN
        ALTER TABLE events ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    -- Add approval_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'approval_status') THEN
        ALTER TABLE events ADD COLUMN approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled'));
    END IF;
    
    -- Add target_minutes column for time-based targets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'target_minutes') THEN
        ALTER TABLE events ADD COLUMN target_minutes INTEGER;
    END IF;
    
    -- Add target_schools column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'target_schools') THEN
        ALTER TABLE events ADD COLUMN target_schools JSONB DEFAULT '[]';
    END IF;
END $$;

-- Create event_participants table for enrollment (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Create function to update participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND is_active = true
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND is_active = true
    )
    WHERE id = OLD.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND is_active = true
    )
    WHERE id = NEW.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the existing event_participants table
DROP TRIGGER IF EXISTS trigger_update_participant_count_insert ON event_participants;
DROP TRIGGER IF EXISTS trigger_update_participant_count_update ON event_participants;
DROP TRIGGER IF EXISTS trigger_update_participant_count_delete ON event_participants;

CREATE TRIGGER trigger_update_participant_count_insert
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

CREATE TRIGGER trigger_update_participant_count_update
  AFTER UPDATE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

CREATE TRIGGER trigger_update_participant_count_delete
  AFTER DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Update existing events to have approval_status = 'approved'
UPDATE events 
SET approval_status = 'approved'
WHERE approval_status IS NULL; 