-- Fix aggregation trigger functions to use SECURITY DEFINER
-- Without SECURITY DEFINER these functions run as the authenticated user (e.g. a
-- student), who has no UPDATE permission on schools or houses.  The UPDATE
-- silently matches 0 rows, so house and school totals never update when a
-- student logs an activity.  Same root cause as migration 049 which fixed
-- get_user_rankings.

CREATE OR REPLACE FUNCTION update_user_totals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_house_totals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_school_totals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
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
$$;
