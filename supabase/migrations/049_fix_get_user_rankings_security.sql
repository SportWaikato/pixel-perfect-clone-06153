-- Fix get_user_rankings to use SECURITY DEFINER so it can always read all users
-- regardless of RLS, and include the requesting user even if is_active = false
-- so their rank is always returned.

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
    WHERE is_active = true OR id = p_user_id
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
$$;
