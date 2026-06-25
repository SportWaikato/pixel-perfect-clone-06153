-- Add badge and points multiplier columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS badge_achievement_id UUID REFERENCES achievements(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS points_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_events_badge_achievement_id ON events(badge_achievement_id);

-- Update activities table to support challenge-specific points calculation
ALTER TABLE activities ADD COLUMN IF NOT EXISTS challenge_points_multiplier DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS base_points INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS final_points INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_challenge_points ON activities(final_points);

-- Update some existing events to have associated badges (examples)
UPDATE events SET 
  badge_achievement_id = (SELECT id FROM achievements WHERE name = 'Connect with Nature' LIMIT 1),
  points_multiplier = 2.0
WHERE name = 'Spring Running Challenge';

UPDATE events SET 
  badge_achievement_id = (SELECT id FROM achievements WHERE name = '#Bring your mate' LIMIT 1),
  points_multiplier = 1.5
WHERE name = 'Cycling Weekend'; 