-- Migration: Add streak tracking fields to users table
-- Date: 2025-07-21
-- Description: Adds fields to track user activity streaks

-- Add streak tracking fields to users table
ALTER TABLE users 
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN last_activity_date DATE DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_current_streak ON users(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_longest_streak ON users(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_activity_date ON users(last_activity_date);

-- Add comments for documentation
COMMENT ON COLUMN users.current_streak IS 'Current consecutive days with activity (minimum 60 minutes per day)';
COMMENT ON COLUMN users.longest_streak IS 'Longest consecutive days streak ever achieved';
COMMENT ON COLUMN users.last_activity_date IS 'Date of last activity (used for streak calculation)';

-- Create function to calculate user streaks based on activities
CREATE OR REPLACE FUNCTION calculate_user_streak(user_id_param UUID)
RETURNS TABLE(current_streak_days INTEGER, longest_streak_days INTEGER, last_activity_date_calc DATE) AS $$
DECLARE
    activity_date DATE;
    streak_count INTEGER := 0;
    max_streak INTEGER := 0;
    temp_streak INTEGER := 0;
    last_date DATE := NULL;
    current_date_streak INTEGER := 0;
    prev_date DATE := NULL;
    consecutive_days BOOLEAN := TRUE;
BEGIN
    -- Get all dates where user had activities with 60+ minutes total per day
    FOR activity_date IN 
        SELECT DATE(created_at) as activity_date
        FROM activities 
        WHERE user_id = user_id_param 
        GROUP BY DATE(created_at)
        HAVING SUM(duration_minutes) >= 60
        ORDER BY DATE(created_at)
    LOOP
        last_date := activity_date;
        
        -- Check if this date is consecutive to previous
        IF prev_date IS NULL THEN
            -- First activity date
            temp_streak := 1;
        ELSIF activity_date = prev_date + INTERVAL '1 day' THEN
            -- Consecutive day
            temp_streak := temp_streak + 1;
        ELSE
            -- Gap in activities, reset streak
            temp_streak := 1;
        END IF;
        
        -- Update max streak if current temp streak is higher
        IF temp_streak > max_streak THEN
            max_streak := temp_streak;
        END IF;
        
        prev_date := activity_date;
    END LOOP;
    
    -- Calculate current streak (only if recent activity)
    IF last_date IS NOT NULL THEN
        IF last_date = CURRENT_DATE THEN
            -- Activity today, current streak is the temp_streak
            current_date_streak := temp_streak;
        ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Activity yesterday, current streak is temp_streak
            current_date_streak := temp_streak;
        ELSE
            -- No recent activity, current streak is 0
            current_date_streak := 0;
        END IF;
    ELSE
        current_date_streak := 0;
    END IF;
    
    RETURN QUERY SELECT current_date_streak, COALESCE(max_streak, 0), last_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user streak when activities change
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    streak_data RECORD;
BEGIN
    -- Get the user_id from the activity
    IF TG_OP = 'DELETE' THEN
        -- For delete operations, use OLD record
        SELECT * INTO streak_data FROM calculate_user_streak(OLD.user_id);
        
        UPDATE users 
        SET current_streak = streak_data.current_streak_days,
            longest_streak = streak_data.longest_streak_days,
            last_activity_date = streak_data.last_activity_date_calc
        WHERE id = OLD.user_id;
    ELSE
        -- For insert/update operations, use NEW record
        SELECT * INTO streak_data FROM calculate_user_streak(NEW.user_id);
        
        UPDATE users 
        SET current_streak = streak_data.current_streak_days,
            longest_streak = streak_data.longest_streak_days,
            last_activity_date = streak_data.last_activity_date_calc
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update streaks when activities change
DROP TRIGGER IF EXISTS trigger_update_user_streak ON activities;
CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Create manual recalculation function for all users
CREATE OR REPLACE FUNCTION recalculate_all_user_streaks()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    streak_data RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        SELECT * INTO streak_data FROM calculate_user_streak(user_record.id);
        
        UPDATE users 
        SET current_streak = streak_data.current_streak_days,
            longest_streak = streak_data.longest_streak_days,
            last_activity_date = streak_data.last_activity_date_calc
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Recalculate streaks for all existing users
SELECT recalculate_all_user_streaks(); 