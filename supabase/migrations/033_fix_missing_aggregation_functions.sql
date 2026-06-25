-- Migration: Fix missing aggregation functions, triggers, and rankings
-- Date: 2025-01-15
-- Description: Recreates missing aggregation functions, fixes Sport Waikato internal flag, and recalculates all totals

-- ============================================
-- PART 1: Mark Sport Waikato as internal
-- ============================================
UPDATE schools
SET is_internal = true
WHERE code = 'SW' OR name = 'Sport Waikato';

-- ============================================
-- PART 2: Create aggregation functions
-- ============================================

-- Function to update user totals from their activities
CREATE OR REPLACE FUNCTION update_user_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Determine which user to update based on trigger operation
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    -- Update user's total points and minutes
    UPDATE users
    SET
        total_points = COALESCE((
            SELECT SUM(final_points)
            FROM activities
            WHERE user_id = target_user_id
        ), 0),
        total_minutes = COALESCE((
            SELECT SUM(duration_minutes)
            FROM activities
            WHERE user_id = target_user_id
        ), 0),
        total_kilometers = COALESCE((
            SELECT SUM(distance_km)
            FROM activities
            WHERE user_id = target_user_id
              AND distance_km IS NOT NULL
        ), 0),
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update house totals
CREATE OR REPLACE FUNCTION update_house_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_house_id UUID;
BEGIN
    -- Get the house_id from the user
    IF TG_OP = 'DELETE' THEN
        SELECT house_id INTO target_house_id
        FROM users
        WHERE id = OLD.user_id;
    ELSE
        SELECT house_id INTO target_house_id
        FROM users
        WHERE id = NEW.user_id;
    END IF;

    -- Only update if user has a house
    IF target_house_id IS NOT NULL THEN
        UPDATE houses
        SET
            total_points = COALESCE((
                SELECT SUM(a.final_points)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = target_house_id
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = target_house_id
                  AND a.distance_km IS NOT NULL
            ), 0),
            updated_at = NOW()
        WHERE id = target_house_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update school totals
CREATE OR REPLACE FUNCTION update_school_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_school_id UUID;
BEGIN
    -- Get the school_id from the user
    IF TG_OP = 'DELETE' THEN
        SELECT school_id INTO target_school_id
        FROM users
        WHERE id = OLD.user_id;
    ELSE
        SELECT school_id INTO target_school_id
        FROM users
        WHERE id = NEW.user_id;
    END IF;

    -- Only update if user has a school
    IF target_school_id IS NOT NULL THEN
        UPDATE schools
        SET
            total_points = COALESCE((
                SELECT SUM(a.final_points)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = target_school_id
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = target_school_id
                  AND a.distance_km IS NOT NULL
            ), 0),
            total_students = COALESCE((
                SELECT COUNT(*)
                FROM users
                WHERE school_id = target_school_id
                  AND is_active = true
            ), 0),
            updated_at = NOW()
        WHERE id = target_school_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update user rankings
CREATE OR REPLACE FUNCTION update_user_rankings()
RETURNS void AS $$
BEGIN
    -- Update school rankings
    WITH school_ranks AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY school_id
                ORDER BY total_points DESC, total_minutes DESC
            ) as rank
        FROM users
        WHERE is_active = true
          AND school_id IS NOT NULL
    )
    UPDATE users u
    SET school_rank = sr.rank
    FROM school_ranks sr
    WHERE u.id = sr.id;

    -- Update house rankings
    WITH house_ranks AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY house_id
                ORDER BY total_points DESC, total_minutes DESC
            ) as rank
        FROM users
        WHERE is_active = true
          AND house_id IS NOT NULL
    )
    UPDATE users u
    SET house_rank = hr.rank
    FROM house_ranks hr
    WHERE u.id = hr.id;

    -- Update year group rankings
    WITH year_ranks AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY school_id, year_group
                ORDER BY total_points DESC, total_minutes DESC
            ) as rank
        FROM users
        WHERE is_active = true
          AND school_id IS NOT NULL
          AND year_group IS NOT NULL
    )
    UPDATE users u
    SET year_group_rank = yr.rank
    FROM year_ranks yr
    WHERE u.id = yr.id;

    -- Update overall rankings
    WITH overall_ranks AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                ORDER BY total_points DESC, total_minutes DESC
            ) as rank
        FROM users
        WHERE is_active = true
    )
    UPDATE users u
    SET overall_rank = or_data.rank
    FROM overall_ranks or_data
    WHERE u.id = or_data.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Create triggers
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_user_totals ON activities;
DROP TRIGGER IF EXISTS trigger_update_house_totals ON activities;
DROP TRIGGER IF EXISTS trigger_update_school_totals ON activities;

-- Create triggers for automatic updates
CREATE TRIGGER trigger_update_user_totals
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_totals();

CREATE TRIGGER trigger_update_house_totals
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_house_totals();

CREATE TRIGGER trigger_update_school_totals
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_school_totals();

-- ============================================
-- PART 4: Create streak calculation functions and trigger
-- ============================================

-- Drop existing streak functions to avoid signature conflicts
DROP FUNCTION IF EXISTS calculate_user_streak(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_streak() CASCADE;
DROP FUNCTION IF EXISTS recalculate_all_user_streaks() CASCADE;

-- Create the calculate_user_streak function with correct signature
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

    -- Get all dates where user had any activities (no minimum threshold for streaks)
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
            -- Gap in dates - reset streak
            temp_streak := 1;
        END IF;

        -- Update max streak if needed
        IF temp_streak > max_streak THEN
            max_streak := temp_streak;
        END IF;

        -- Check if this streak continues to today (or yesterday)
        IF activity_date >= nz_today - INTERVAL '1 day' THEN
            current_date_streak := temp_streak;
        END IF;

        prev_date := activity_date;
    END LOOP;

    -- If last activity was not today or yesterday, current streak is 0
    IF last_date IS NULL OR last_date < nz_today - INTERVAL '1 day' THEN
        current_date_streak := 0;
    END IF;

    RETURN QUERY SELECT current_date_streak, max_streak, last_date;
END;
$$ LANGUAGE plpgsql;

-- Now create the update_user_streak function
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

    -- Calculate streak for this user
    SELECT * INTO streak_data FROM calculate_user_streak(target_user_id);

    -- Update user record
    UPDATE users
    SET current_streak = streak_data.current_streak_days,
        longest_streak = GREATEST(longest_streak, streak_data.longest_streak_days),
        last_activity_date = streak_data.last_activity_date_calc
    WHERE id = target_user_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create function to recalculate all user streaks
CREATE OR REPLACE FUNCTION recalculate_all_user_streaks()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    streak_data RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users WHERE is_active = true LOOP
        SELECT * INTO streak_data FROM calculate_user_streak(user_record.id);

        UPDATE users
        SET current_streak = streak_data.current_streak_days,
            longest_streak = GREATEST(COALESCE(longest_streak, 0), streak_data.longest_streak_days),
            last_activity_date = streak_data.last_activity_date_calc
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Now create the trigger
DROP TRIGGER IF EXISTS trigger_update_user_streak ON activities;

CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- ============================================
-- PART 5: Recalculate all totals from existing data
-- ============================================

-- Recalculate all user totals
UPDATE users u
SET
    total_points = COALESCE((
        SELECT SUM(final_points)
        FROM activities
        WHERE user_id = u.id
    ), 0),
    total_minutes = COALESCE((
        SELECT SUM(duration_minutes)
        FROM activities
        WHERE user_id = u.id
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(distance_km)
        FROM activities
        WHERE user_id = u.id
          AND distance_km IS NOT NULL
    ), 0);

-- Recalculate all house totals
UPDATE houses h
SET
    total_points = COALESCE((
        SELECT SUM(a.final_points)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.house_id = h.id
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(a.distance_km)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.house_id = h.id
          AND a.distance_km IS NOT NULL
    ), 0);

-- Recalculate all school totals
UPDATE schools s
SET
    total_points = COALESCE((
        SELECT SUM(a.final_points)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.school_id = s.id
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(a.distance_km)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.school_id = s.id
          AND a.distance_km IS NOT NULL
    ), 0),
    total_students = COALESCE((
        SELECT COUNT(*)
        FROM users
        WHERE school_id = s.id
          AND is_active = true
    ), 0);

-- Update all user rankings
SELECT update_user_rankings();

-- Recalculate all user streaks
SELECT recalculate_all_user_streaks();

-- ============================================
-- PART 6: Add function for retrospective streak updates
-- ============================================

-- Function to properly handle retrospective activity logging
CREATE OR REPLACE FUNCTION update_user_streak_for_date(
  p_user_id UUID,
  p_activity_date DATE
) RETURNS void AS $$
BEGIN
  -- Recalculate the entire streak for this user
  PERFORM calculate_user_streak(p_user_id);

  -- Update the user record
  UPDATE users
  SET (current_streak, longest_streak, last_activity_date) =
    (SELECT current_streak_days, longest_streak_days, last_activity_date_calc
     FROM calculate_user_streak(p_user_id))
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: Verify the results
-- ============================================

-- Log summary of the fix
DO $$
DECLARE
    v_total_users INTEGER;
    v_total_activities INTEGER;
    v_total_points INTEGER;
    v_users_with_points INTEGER;
    v_schools_with_points INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_users FROM users WHERE is_active = true;
    SELECT COUNT(*) INTO v_total_activities FROM activities;
    SELECT SUM(total_points) INTO v_total_points FROM users;
    SELECT COUNT(*) INTO v_users_with_points FROM users WHERE total_points > 0;
    SELECT COUNT(*) INTO v_schools_with_points FROM schools WHERE total_points > 0;

    RAISE NOTICE 'Migration Complete:';
    RAISE NOTICE '  Total active users: %', v_total_users;
    RAISE NOTICE '  Total activities: %', v_total_activities;
    RAISE NOTICE '  Total points across all users: %', v_total_points;
    RAISE NOTICE '  Users with points: %', v_users_with_points;
    RAISE NOTICE '  Schools with points: %', v_schools_with_points;
    RAISE NOTICE '  Sport Waikato marked as internal: Yes';
END $$;