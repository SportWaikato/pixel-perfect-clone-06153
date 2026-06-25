-- Migration 011: Transition to time-based system
-- Note: This migration has already been executed in the database.
-- This file is for documentation purposes only.

-- 1. Add new time-based fields to users table
ALTER TABLE users 
ADD COLUMN total_minutes INTEGER DEFAULT 0,
ADD COLUMN monthly_goal_minutes INTEGER DEFAULT 1800; -- Default 30 hours per month

-- 2. Update existing users with calculated time from their total_kilometers
-- Using average conversion rate of 0.008 km/min (reverse = 125 min/km)
UPDATE users 
SET total_minutes = ROUND(total_kilometers * 125)
WHERE total_kilometers > 0;

-- 3. Update activities that have distance but no duration
-- Calculate duration_minutes for records that don't have it using activity-specific conversion rates
UPDATE activities 
SET duration_minutes = CASE 
    WHEN activity_type = 'walking' THEN ROUND(distance_km / 0.0006)
    WHEN activity_type = 'running' THEN ROUND(distance_km / 0.01)
    WHEN activity_type = 'cycling' THEN ROUND(distance_km / 0.016)
    WHEN activity_type = 'swimming' THEN ROUND(distance_km / 0.008)
    WHEN activity_type = 'team_sports' THEN ROUND(distance_km / 0.01)
    WHEN activity_type = 'gym_fitness' THEN ROUND(distance_km / 0.006)
    WHEN activity_type = 'dance' THEN ROUND(distance_km / 0.008)
    ELSE ROUND(distance_km / 0.006) -- Default 'other' rate
END
WHERE duration_minutes IS NULL OR duration_minutes = 0;

-- 4. Make duration_minutes required going forward
ALTER TABLE activities 
ALTER COLUMN duration_minutes SET NOT NULL,
ALTER COLUMN duration_minutes SET DEFAULT 0;

-- 5. Update input_type default to 'time'
ALTER TABLE activities 
ALTER COLUMN input_type SET DEFAULT 'time';

-- 6. Create function to update user total minutes when activities change
CREATE OR REPLACE FUNCTION update_user_total_minutes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user total when activity duration changes
    IF TG_OP = 'UPDATE' AND OLD.duration_minutes != NEW.duration_minutes THEN
        -- Recalculate user total from all activities
        UPDATE users 
        SET total_minutes = (
            SELECT COALESCE(SUM(duration_minutes), 0) 
            FROM activities 
            WHERE user_id = NEW.user_id
        )
        WHERE id = NEW.user_id;
    END IF;
    
    -- Handle INSERT (new activity)
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET total_minutes = (
            SELECT COALESCE(SUM(duration_minutes), 0) 
            FROM activities 
            WHERE user_id = NEW.user_id
        )
        WHERE id = NEW.user_id;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET total_minutes = (
            SELECT COALESCE(SUM(duration_minutes), 0) 
            FROM activities 
            WHERE user_id = OLD.user_id
        )
        WHERE id = OLD.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for user total minutes
DROP TRIGGER IF EXISTS trigger_update_user_total_minutes ON activities;
CREATE TRIGGER trigger_update_user_total_minutes
    AFTER INSERT OR UPDATE OF duration_minutes OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_minutes();

-- 8. Update school and house totals to use time-based calculations
-- Recalculate current totals based on user minutes
UPDATE schools 
SET total_kilometers = (
    SELECT COALESCE(SUM(u.total_minutes * 0.008), 0) -- Convert minutes to km for display
    FROM users u 
    WHERE u.school_id = schools.id
);

UPDATE houses 
SET total_kilometers = (
    SELECT COALESCE(SUM(u.total_minutes * 0.008), 0) -- Convert minutes to km for display
    FROM users u 
    WHERE u.house_id = houses.id
);

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_total_minutes ON users(total_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_activities_duration_minutes ON activities(duration_minutes);

-- 10. Add comments for documentation
COMMENT ON COLUMN users.total_minutes IS 'Total activity time in minutes - primary measure';
COMMENT ON COLUMN users.monthly_goal_minutes IS 'Monthly activity goal in minutes';
COMMENT ON COLUMN users.total_kilometers IS 'Legacy distance field - now calculated from total_minutes for display'; 