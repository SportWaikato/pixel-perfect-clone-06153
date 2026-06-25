-- Enhance events table with new columns
ALTER TABLE events ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE events ADD COLUMN target_schools UUID[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved'
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- Add indexes for better performance on events table
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_approval_status ON events(approval_status);
CREATE INDEX idx_events_target_schools ON events USING GIN(target_schools);

-- Event participation tracking
CREATE TABLE event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_distance DECIMAL(8,3) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Add indexes for event_participants table
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX idx_event_participants_joined_at ON event_participants(joined_at);

-- Add RLS policies for event_participants table
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own participation records
CREATE POLICY "Users can view their own event participation" ON event_participants
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can insert their own participation records
CREATE POLICY "Users can join events" ON event_participants
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own participation records
CREATE POLICY "Users can update their own event participation" ON event_participants
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: School admins can view participation for events targeting their school
CREATE POLICY "School admins can view school event participation" ON event_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_admins sa
            JOIN users u ON u.id = event_participants.user_id
            WHERE sa.user_id = auth.uid() 
            AND sa.school_id = u.school_id
        )
        OR
        EXISTS (
            SELECT 1 FROM events e
            JOIN school_admins sa ON sa.school_id = ANY(e.target_schools)
            WHERE e.id = event_participants.event_id
            AND sa.user_id = auth.uid()
        )
    );

-- Policy: Super admins can manage all event participation records
CREATE POLICY "Super admins can manage event participation" ON event_participants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Add trigger to update participant_count on events table
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events 
        SET participant_count = participant_count + 1
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET participant_count = GREATEST(participant_count - 1, 0)
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_participant_count
    AFTER INSERT OR DELETE ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_event_participant_count(); 