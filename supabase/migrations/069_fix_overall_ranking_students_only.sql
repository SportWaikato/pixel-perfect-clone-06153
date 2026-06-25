-- Fix overall_rank to only include students (role = 'student'), not admins.
-- School, house, and year group rankings are unchanged.

CREATE OR REPLACE FUNCTION get_user_rankings(p_user_id UUID)
RETURNS TABLE(
  school_rank            BIGINT,
  school_total_users     BIGINT,
  house_rank             BIGINT,
  house_total_users      BIGINT,
  year_group_rank        BIGINT,
  year_group_total_users BIGINT,
  overall_rank           BIGINT,
  overall_total_users    BIGINT
) SECURITY DEFINER
SET search_path = public
LANGUAGE SQL STABLE AS $$
  WITH all_active AS (
    SELECT *
    FROM users
    WHERE is_active = true OR id = p_user_id
  ),
  ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY school_id    ORDER BY total_points DESC NULLS LAST) AS school_rank,
      COUNT(*)     OVER (PARTITION BY school_id)                                          AS school_total,
      ROW_NUMBER() OVER (PARTITION BY house_id     ORDER BY total_points DESC NULLS LAST) AS house_rank,
      COUNT(*)     OVER (PARTITION BY house_id)                                           AS house_total,
      ROW_NUMBER() OVER (PARTITION BY school_id, year_group ORDER BY total_points DESC NULLS LAST) AS year_group_rank,
      COUNT(*)     OVER (PARTITION BY school_id, year_group)                             AS year_group_total,
      ROW_NUMBER() OVER (
        PARTITION BY CASE WHEN role = 'student' THEN true ELSE NULL END
        ORDER BY total_points DESC NULLS LAST
      )                                                                                   AS overall_rank,
      COUNT(*) FILTER (WHERE role = 'student') OVER ()                                   AS overall_total
    FROM all_active
  )
  SELECT
    ranked.school_rank,
    ranked.school_total,
    ranked.house_rank,
    ranked.house_total,
    ranked.year_group_rank,
    ranked.year_group_total,
    CASE WHEN (SELECT role FROM users WHERE id = p_user_id) = 'student' THEN ranked.overall_rank ELSE NULL END,
    ranked.overall_total
  FROM ranked
  WHERE ranked.id = p_user_id;
$$;

-- Recalculate overall_rank on the users table to only include students
CREATE OR REPLACE FUNCTION recalculate_all_rankings()
RETURNS void AS $$
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY school_id    ORDER BY total_points DESC NULLS LAST)                AS school_rank,
      ROW_NUMBER() OVER (PARTITION BY house_id     ORDER BY total_points DESC NULLS LAST)                AS house_rank,
      ROW_NUMBER() OVER (PARTITION BY school_id, year_group ORDER BY total_points DESC NULLS LAST)       AS year_group_rank,
      CASE WHEN role = 'student'
        THEN ROW_NUMBER() OVER (PARTITION BY role ORDER BY total_points DESC NULLS LAST)
        ELSE NULL
      END                                                                                                 AS overall_rank
    FROM users
    WHERE is_active = true
  )
  UPDATE users
  SET
    school_rank     = ranked.school_rank,
    house_rank      = ranked.house_rank,
    year_group_rank = ranked.year_group_rank,
    overall_rank    = ranked.overall_rank
  FROM ranked
  WHERE users.id = ranked.id;
$$ LANGUAGE SQL;

SELECT recalculate_all_rankings();
