-- Migration 075: Add index on schools.total_kilometers
--
-- SchoolService.getLeaderboard() orders by total_kilometers DESC but this column
-- had no index. Migration 074 covered total_points; this covers the km leaderboard.

CREATE INDEX IF NOT EXISTS idx_schools_total_kilometers
  ON schools (total_kilometers DESC)
  WHERE is_active = true;
