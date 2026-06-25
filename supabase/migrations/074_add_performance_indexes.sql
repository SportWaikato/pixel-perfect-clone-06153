-- Migration 074: Add performance indexes
--
-- These indexes target the most frequent query patterns identified during the
-- performance audit. Each covers a hot path in the application:
--
--   activities(user_id, created_at DESC)     → getUserActivities, getByUserId, dashboard
--   activities(event_id)                     → event participation lookups
--   user_achievements(user_id, achievement_id) → achievement checks on every activity
--   users(school_id, total_points DESC)      → school leaderboard
--   users(house_id, total_points DESC)       → house leaderboard
--   school_updates(school_id, is_active, created_at DESC) → updates feed + admin view
--
-- Note: CONCURRENTLY is not used here because Supabase CLI wraps migrations
-- in a transaction and CONCURRENTLY is incompatible with transactions.
-- Table locks during index creation are momentary on these table sizes.

CREATE INDEX IF NOT EXISTS idx_activities_user_created
  ON activities (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_event_id
  ON activities (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement
  ON user_achievements (user_id, achievement_id);

CREATE INDEX IF NOT EXISTS idx_users_school_points
  ON users (school_id, total_points DESC);

CREATE INDEX IF NOT EXISTS idx_users_house_points
  ON users (house_id, total_points DESC);

CREATE INDEX IF NOT EXISTS idx_school_updates_school_active_created
  ON school_updates (school_id, is_active, created_at DESC);
