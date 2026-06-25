-- Migration: Enhanced Retrospective Streak Calculation
-- Date: 2025-01-15
-- Description: Ensures streak calculations work properly for activities logged retroactively

-- ============================================
-- PART 1: Enhanced streak calculation that handles retrospective logging
-- ============================================

-- Drop and recreate the update_user_streak function with better retrospective handling
DROP FUNCTION IF EXISTS update_user_streak() CASCADE;

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    streak_data RECORD;
BEGIN
    -- Determine which user to update
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    -- Always recalculate the entire streak history for the user
    -- This ensures retrospective logging is properly handled
    SELECT * INTO streak_data FROM calculate_user_streak(target_user_id);

    -- Update user record
    UPDATE users
    SET
        current_streak = streak_data.current_streak_days,
        longest_streak = GREATEST(
            COALESCE(longest_streak, 0),
            streak_data.longest_streak_days
        ), -- Never decrease longest_streak
        last_activity_date = streak_data.last_activity_date_calc
    WHERE id = target_user_id;

    -- Log for debugging (can be removed in production)
    RAISE NOTICE 'Streak updated for user %: current=%, longest=%',
                 target_user_id,
                 streak_data.current_streak_days,
                 streak_data.longest_streak_days;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: Recreate trigger with better handling
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_user_streak ON activities;

CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- ============================================
-- PART 3: Add manual recalculation function for admin use
-- ============================================

-- Function that admins can call to fix any user's streak
CREATE OR REPLACE FUNCTION fix_user_streak(p_user_id UUID)
RETURNS TABLE(
    username VARCHAR,
    current_streak INTEGER,
    longest_streak INTEGER,
    last_activity_date DATE,
    message TEXT
) AS $$
DECLARE
    streak_data RECORD;
    v_username VARCHAR;
BEGIN
    -- Get username for logging
    SELECT u.username INTO v_username FROM users u WHERE u.id = p_user_id;

    -- Calculate correct streak
    SELECT * INTO streak_data FROM calculate_user_streak(p_user_id);

    -- Update the user
    UPDATE users
    SET
        current_streak = streak_data.current_streak_days,
        longest_streak = GREATEST(
            COALESCE(longest_streak, 0),
            streak_data.longest_streak_days
        ),
        last_activity_date = streak_data.last_activity_date_calc
    WHERE id = p_user_id;

    -- Return the results
    RETURN QUERY
    SELECT
        v_username,
        streak_data.current_streak_days,
        streak_data.longest_streak_days,
        streak_data.last_activity_date_calc,
        'Streak recalculated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Add function to fix all users with broken streaks
-- ============================================

CREATE OR REPLACE FUNCTION fix_all_broken_streaks()
RETURNS TABLE(
    fixed_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_fixed_count INTEGER := 0;
    user_record RECORD;
    streak_data RECORD;
    v_old_current INTEGER;
    v_old_longest INTEGER;
BEGIN
    -- Find and fix users whose streaks might be incorrect
    FOR user_record IN
        SELECT u.id, u.username, u.current_streak, u.longest_streak
        FROM users u
        WHERE EXISTS (
            SELECT 1 FROM activities a WHERE a.user_id = u.id
        )
    LOOP
        v_old_current := user_record.current_streak;
        v_old_longest := user_record.longest_streak;

        -- Recalculate
        SELECT * INTO streak_data FROM calculate_user_streak(user_record.id);

        -- Check if update is needed
        IF v_old_current != streak_data.current_streak_days OR
           v_old_longest < streak_data.longest_streak_days THEN

            UPDATE users
            SET
                current_streak = streak_data.current_streak_days,
                longest_streak = GREATEST(
                    COALESCE(v_old_longest, 0),
                    streak_data.longest_streak_days
                ),
                last_activity_date = streak_data.last_activity_date_calc
            WHERE id = user_record.id;

            v_fixed_count := v_fixed_count + 1;

            RAISE NOTICE 'Fixed streak for %: current % -> %, longest % -> %',
                user_record.username,
                v_old_current,
                streak_data.current_streak_days,
                v_old_longest,
                GREATEST(v_old_longest, streak_data.longest_streak_days);
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT v_fixed_count, format('Fixed %s users with incorrect streaks', v_fixed_count);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Run the fixes
-- ============================================

-- Fix all broken streaks
SELECT * FROM fix_all_broken_streaks();

-- Recalculate all streaks one more time to ensure consistency
SELECT recalculate_all_user_streaks();

-- ============================================
-- PART 6: Add comment for documentation
-- ============================================

COMMENT ON FUNCTION fix_user_streak(UUID) IS
'Manually recalculate and fix streak for a specific user. Useful for debugging or fixing individual cases.';

COMMENT ON FUNCTION fix_all_broken_streaks() IS
'Scan all users and fix any incorrect streak calculations. Returns count of users fixed.';