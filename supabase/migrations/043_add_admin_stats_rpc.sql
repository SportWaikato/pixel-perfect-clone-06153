-- Returns activity counts grouped by type for the admin dashboard.
-- Replaces a full table scan + JS aggregation in AdminPage.
-- SECURITY DEFINER bypasses per-row RLS evaluation during GROUP BY aggregation,
-- consistent with the pattern used in get_user_rankings (migration 041).
CREATE OR REPLACE FUNCTION get_activity_type_counts()
RETURNS TABLE(activity_type TEXT, count BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    activity_type,
    COUNT(*) AS count
  FROM activities
  GROUP BY activity_type
  ORDER BY count DESC;
$$;
