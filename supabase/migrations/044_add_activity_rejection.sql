-- Migration: Add activity rejection for admin fraud detection
-- Date: 2026-04-15
-- Description: Adds is_rejected column to activities, updates aggregation triggers
--              to exclude rejected activities, and adds RLS policy for admin rejection.

-- ============================================
-- PART 1: Add is_rejected column
-- ============================================

ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT false;

-- ============================================
-- PART 2: Update aggregation functions to exclude rejected activities
-- ============================================

-- Update user totals trigger to exclude rejected activities
CREATE OR REPLACE FUNCTION update_user_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    UPDATE users
    SET
        total_points = COALESCE((
            SELECT SUM(final_points)
            FROM activities
            WHERE user_id = target_user_id
              AND is_rejected IS NOT TRUE
        ), 0),
        total_minutes = COALESCE((
            SELECT SUM(duration_minutes)
            FROM activities
            WHERE user_id = target_user_id
              AND is_rejected IS NOT TRUE
        ), 0),
        total_kilometers = COALESCE((
            SELECT SUM(distance_km)
            FROM activities
            WHERE user_id = target_user_id
              AND distance_km IS NOT NULL
              AND is_rejected IS NOT TRUE
        ), 0),
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update house totals trigger to exclude rejected activities
CREATE OR REPLACE FUNCTION update_house_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_house_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT house_id INTO target_house_id
        FROM users
        WHERE id = OLD.user_id;
    ELSE
        SELECT house_id INTO target_house_id
        FROM users
        WHERE id = NEW.user_id;
    END IF;

    IF target_house_id IS NOT NULL THEN
        UPDATE houses
        SET
            total_points = COALESCE((
                SELECT SUM(a.final_points)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = target_house_id
                  AND a.is_rejected IS NOT TRUE
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = target_house_id
                  AND a.distance_km IS NOT NULL
                  AND a.is_rejected IS NOT TRUE
            ), 0),
            updated_at = NOW()
        WHERE id = target_house_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update school totals trigger to exclude rejected activities
CREATE OR REPLACE FUNCTION update_school_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_school_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT school_id INTO target_school_id
        FROM users
        WHERE id = OLD.user_id;
    ELSE
        SELECT school_id INTO target_school_id
        FROM users
        WHERE id = NEW.user_id;
    END IF;

    IF target_school_id IS NOT NULL THEN
        UPDATE schools
        SET
            total_points = COALESCE((
                SELECT SUM(a.final_points)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = target_school_id
                  AND a.is_rejected IS NOT TRUE
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = target_school_id
                  AND a.distance_km IS NOT NULL
                  AND a.is_rejected IS NOT TRUE
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

-- Update streak calculation to exclude rejected activities
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
    nz_today := (NOW() AT TIME ZONE 'Pacific/Auckland')::DATE;

    FOR activity_date IN
        SELECT DATE(created_at AT TIME ZONE 'Pacific/Auckland') as activity_date
        FROM activities
        WHERE user_id = user_id_param
          AND is_rejected IS NOT TRUE
        GROUP BY DATE(created_at AT TIME ZONE 'Pacific/Auckland')
        HAVING SUM(duration_minutes) > 0
        ORDER BY DATE(created_at AT TIME ZONE 'Pacific/Auckland')
    LOOP
        last_date := activity_date;

        IF prev_date IS NULL THEN
            temp_streak := 1;
        ELSIF activity_date = prev_date + INTERVAL '1 day' THEN
            temp_streak := temp_streak + 1;
        ELSE
            temp_streak := 1;
        END IF;

        IF temp_streak > max_streak THEN
            max_streak := temp_streak;
        END IF;

        IF activity_date >= nz_today - INTERVAL '1 day' THEN
            current_date_streak := temp_streak;
        END IF;

        prev_date := activity_date;
    END LOOP;

    IF last_date IS NULL OR last_date < nz_today - INTERVAL '1 day' THEN
        current_date_streak := 0;
    END IF;

    RETURN QUERY SELECT current_date_streak, max_streak, last_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: RLS policy for admin rejection
-- ============================================

-- School admins can update activities (for rejection) of users in their school
-- Super admins can update any activity
DROP POLICY IF EXISTS "School admins can reject activities" ON activities;

CREATE POLICY "School admins can reject activities" ON activities
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users me
            WHERE me.id = auth.uid()
              AND me.role IN ('super_admin', 'school_admin')
              AND (
                  me.role = 'super_admin'
                  OR EXISTS (
                      SELECT 1 FROM users owner
                      WHERE owner.id = activities.user_id
                        AND owner.school_id = me.school_id
                  )
              )
        )
    )
    WITH CHECK (true);
