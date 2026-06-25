-- Fix streak calculation logic to be more intuitive and timezone-aware
-- Date: 2025-01-11
-- Description: Fixes streak calculation to work properly with NZ timezone and lower daily thresholds

-- Drop existing trigger and functions to recreate them with fixes
DROP TRIGGER IF EXISTS trigger_update_user_streak ON activities;
DROP FUNCTION IF EXISTS update_user_streak();
DROP FUNCTION IF EXISTS calculate_user_streak(UUID);

-- Create improved function to calculate user streaks
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
    nz_today DATE;
BEGIN
    -- Get current NZ date (approximate - could be refined with proper timezone)
    nz_today := (NOW() AT TIME ZONE 'Pacific/Auckland')::DATE;
    
    -- Get all dates where user had any activities (no minimum threshold)
    FOR activity_date IN 
        SELECT DATE(created_at AT TIME ZONE 'Pacific/Auckland') as activity_date
        FROM activities 
        WHERE user_id = user_id_param 
        GROUP BY DATE(created_at AT TIME ZONE 'Pacific/Auckland')
        HAVING SUM(duration_minutes) > 0  -- Any activity counts for streak
        ORDER BY DATE(created_at AT TIME ZONE 'Pacific/Auckland')
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
    
    -- Calculate current streak - ONLY count if activity is today
    IF last_date IS NOT NULL AND last_date = nz_today THEN
        -- Activity today, current streak continues
        current_date_streak := temp_streak;
    ELSIF last_date IS NOT NULL AND last_date = nz_today - INTERVAL '1 day' THEN
        -- Activity yesterday - streak is maintained but not growing
        current_date_streak := temp_streak;
    ELSE
        -- No recent activity, streak is broken
        current_date_streak := 0;
    END IF;
    
    RETURN QUERY SELECT current_date_streak, COALESCE(max_streak, 0), last_date;
END;
$$ LANGUAGE plpgsql;

-- Create improved function to update user streak when activities change
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    streak_data RECORD;
    target_user_id UUID;
BEGIN
    -- Get the user_id from the activity
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;
    
    -- Calculate new streak data
    SELECT * INTO streak_data FROM calculate_user_streak(target_user_id);
    
    -- Update user record
    UPDATE users 
    SET current_streak = streak_data.current_streak_days,
        longest_streak = GREATEST(longest_streak, streak_data.longest_streak_days), -- Never decrease longest_streak
        last_activity_date = streak_data.last_activity_date_calc
    WHERE id = target_user_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to automatically update streaks when activities change
CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Create function to recalculate all user streaks (retroactive fix)
CREATE OR REPLACE FUNCTION recalculate_all_user_streaks()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    streak_data RECORD;
BEGIN
    RAISE NOTICE 'Starting streak recalculation for all users...';
    
    FOR user_record IN SELECT id, username FROM users WHERE is_active = true LOOP
        SELECT * INTO streak_data FROM calculate_user_streak(user_record.id);
        
        UPDATE users 
        SET current_streak = streak_data.current_streak_days,
            longest_streak = GREATEST(COALESCE(longest_streak, 0), streak_data.longest_streak_days),
            last_activity_date = streak_data.last_activity_date_calc
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated streaks for user %: current=%, longest=%', 
                     user_record.username, 
                     streak_data.current_streak_days, 
                     streak_data.longest_streak_days;
    END LOOP;
    
    RAISE NOTICE 'Finished streak recalculation for all users.';
END;
$$ LANGUAGE plpgsql;

-- Run retroactive streak calculation for all existing users
SELECT recalculate_all_user_streaks();

-- Update comments for documentation
COMMENT ON COLUMN users.current_streak IS 'Current consecutive days with activity (any duration counts, NZ timezone)';
COMMENT ON COLUMN users.longest_streak IS 'Longest consecutive days streak ever achieved (never decreases)';
COMMENT ON COLUMN users.last_activity_date IS 'Date of last activity in NZ timezone (used for streak calculation)';