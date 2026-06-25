-- Fix ranking RPC functions to use total_points instead of total_kilometers,
-- and recalculate all aggregated totals so the leaderboard reflects real data.

CREATE OR REPLACE FUNCTION get_user_rankings(p_user_id UUID)
RETURNS TABLE(
  school_rank       BIGINT,
  school_total_users BIGINT,
  house_rank        BIGINT,
  house_total_users  BIGINT,
  year_group_rank   BIGINT,
  year_group_total_users BIGINT,
  overall_rank      BIGINT,
  overall_total_users BIGINT
) AS $$
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY school_id    ORDER BY total_points DESC NULLS LAST) AS school_rank,
      COUNT(*)     OVER (PARTITION BY school_id)                                          AS school_total,
      ROW_NUMBER() OVER (PARTITION BY house_id     ORDER BY total_points DESC NULLS LAST) AS house_rank,
      COUNT(*)     OVER (PARTITION BY house_id)                                           AS house_total,
      ROW_NUMBER() OVER (PARTITION BY school_id, year_group ORDER BY total_points DESC NULLS LAST) AS year_group_rank,
      COUNT(*)     OVER (PARTITION BY school_id, year_group)                             AS year_group_total,
      ROW_NUMBER() OVER (ORDER BY total_points DESC NULLS LAST)                          AS overall_rank,
      COUNT(*)     OVER ()                                                                AS overall_total
    FROM users
    WHERE is_active = true
  )
  SELECT
    ranked.school_rank,
    ranked.school_total,
    ranked.house_rank,
    ranked.house_total,
    ranked.year_group_rank,
    ranked.year_group_total,
    ranked.overall_rank,
    ranked.overall_total
  FROM ranked
  WHERE ranked.id = p_user_id;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION recalculate_all_rankings()
RETURNS void AS $$
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY school_id    ORDER BY total_points DESC NULLS LAST)          AS school_rank,
      ROW_NUMBER() OVER (PARTITION BY house_id     ORDER BY total_points DESC NULLS LAST)           AS house_rank,
      ROW_NUMBER() OVER (PARTITION BY school_id, year_group ORDER BY total_points DESC NULLS LAST) AS year_group_rank,
      ROW_NUMBER() OVER (ORDER BY total_points DESC NULLS LAST)                                    AS overall_rank
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

-- Recalculate all aggregated totals from live activity data
UPDATE users u
SET
    total_points     = COALESCE((SELECT SUM(final_points)     FROM activities WHERE user_id = u.id), 0),
    total_minutes    = COALESCE((SELECT SUM(duration_minutes) FROM activities WHERE user_id = u.id), 0),
    total_kilometers = COALESCE((SELECT SUM(distance_km)      FROM activities WHERE user_id = u.id AND distance_km IS NOT NULL), 0);

UPDATE houses h
SET
    total_points     = COALESCE((
        SELECT SUM(a.final_points)
        FROM activities a JOIN users u ON a.user_id = u.id
        WHERE u.house_id = h.id
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(a.distance_km)
        FROM activities a JOIN users u ON a.user_id = u.id
        WHERE u.house_id = h.id AND a.distance_km IS NOT NULL
    ), 0);

UPDATE schools s
SET
    total_points     = COALESCE((
        SELECT SUM(a.final_points)
        FROM activities a JOIN users u ON a.user_id = u.id
        WHERE u.school_id = s.id
    ), 0),
    total_kilometers = COALESCE((
        SELECT SUM(a.distance_km)
        FROM activities a JOIN users u ON a.user_id = u.id
        WHERE u.school_id = s.id AND a.distance_km IS NOT NULL
    ), 0),
    total_students   = COALESCE((
        SELECT COUNT(*) FROM users
        WHERE school_id = s.id AND is_active = true
    ), 0);
