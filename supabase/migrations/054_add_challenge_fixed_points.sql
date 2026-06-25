-- Add challenge_points to events: a fixed point reward for completing a challenge activity.
-- When set, activities logged for this event earn exactly this many points (no per-minute calculation).
ALTER TABLE events ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT NULL;
