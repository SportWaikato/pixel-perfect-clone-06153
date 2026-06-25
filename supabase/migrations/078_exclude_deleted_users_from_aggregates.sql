-- Exclude soft-deleted users from house and school points aggregation.
--
-- Previously, update_house_totals() and update_school_totals() did not filter
-- on users.is_deleted, so a deleted user's activities kept contributing to
-- house/school totals.  Two changes fix this:
--
--   1. The existing activity-level trigger functions now add AND u.is_deleted IS NOT TRUE.
--   2. A new trigger on users.is_deleted fires when a user is soft-deleted or
--      restored, immediately recalculating the affected house and school totals.
--   3. A one-time recalculation corrects any houses/schools already skewed by
--      previously deleted users.

-- ─── 1. Update update_house_totals() ────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_house_totals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    target_house_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT house_id INTO target_house_id FROM users WHERE id = OLD.user_id;
    ELSE
        SELECT house_id INTO target_house_id FROM users WHERE id = NEW.user_id;
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
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = target_house_id
                  AND a.distance_km IS NOT NULL
                  AND a.is_rejected IS NOT TRUE
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            updated_at = NOW()
        WHERE id = target_house_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── 2. Update update_school_totals() ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_school_totals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    target_school_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT school_id INTO target_school_id FROM users WHERE id = OLD.user_id;
    ELSE
        SELECT school_id INTO target_school_id FROM users WHERE id = NEW.user_id;
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
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = target_school_id
                  AND a.distance_km IS NOT NULL
                  AND a.is_rejected IS NOT TRUE
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            total_students = COALESCE((
                SELECT COUNT(*)
                FROM users
                WHERE school_id = target_school_id
                  AND is_active = true
                  AND is_deleted IS NOT TRUE
            ), 0),
            updated_at = NOW()
        WHERE id = target_school_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── 3. Trigger function: recalculate when is_deleted changes on a user ──────

CREATE OR REPLACE FUNCTION update_aggregates_on_user_soft_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.is_deleted IS NOT DISTINCT FROM NEW.is_deleted THEN
        RETURN NEW;
    END IF;

    IF NEW.house_id IS NOT NULL THEN
        UPDATE houses
        SET
            total_points = COALESCE((
                SELECT SUM(a.final_points)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = NEW.house_id
                  AND a.is_rejected IS NOT TRUE
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.house_id = NEW.house_id
                  AND a.distance_km IS NOT NULL
                  AND a.is_rejected IS NOT TRUE
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            updated_at = NOW()
        WHERE id = NEW.house_id;
    END IF;

    IF NEW.school_id IS NOT NULL THEN
        UPDATE schools
        SET
            total_points = COALESCE((
                SELECT SUM(a.final_points)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = NEW.school_id
                  AND a.is_rejected IS NOT TRUE
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            total_kilometers = COALESCE((
                SELECT SUM(a.distance_km)
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE u.school_id = NEW.school_id
                  AND a.distance_km IS NOT NULL
                  AND a.is_rejected IS NOT TRUE
                  AND u.is_deleted IS NOT TRUE
            ), 0),
            total_students = COALESCE((
                SELECT COUNT(*)
                FROM users
                WHERE school_id = NEW.school_id
                  AND is_active = true
                  AND is_deleted IS NOT TRUE
            ), 0),
            updated_at = NOW()
        WHERE id = NEW.school_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_aggregates_on_user_soft_delete
    AFTER UPDATE OF is_deleted ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_aggregates_on_user_soft_delete();

-- ─── 4. Backfill: recalculate all houses and schools ────────────────────────

UPDATE houses h
SET
    total_points = COALESCE((
        SELECT SUM(a.final_points)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.house_id = h.id
          AND a.is_rejected IS NOT TRUE
          AND u.is_deleted IS NOT TRUE
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(a.distance_km)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.house_id = h.id
          AND a.distance_km IS NOT NULL
          AND a.is_rejected IS NOT TRUE
          AND u.is_deleted IS NOT TRUE
    ), 0),
    updated_at = NOW();

UPDATE schools s
SET
    total_points = COALESCE((
        SELECT SUM(a.final_points)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.school_id = s.id
          AND a.is_rejected IS NOT TRUE
          AND u.is_deleted IS NOT TRUE
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(a.distance_km)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.school_id = s.id
          AND a.distance_km IS NOT NULL
          AND a.is_rejected IS NOT TRUE
          AND u.is_deleted IS NOT TRUE
    ), 0),
    total_students = COALESCE((
        SELECT COUNT(*)
        FROM users u
        WHERE u.school_id = s.id
          AND u.is_active = true
          AND u.is_deleted IS NOT TRUE
    ), 0),
    updated_at = NOW();
