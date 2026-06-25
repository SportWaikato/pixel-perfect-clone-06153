-- Migration 009 created trigger_update_school_totals and trigger_update_house_totals
-- on the users table. Migration 033 redefined these functions to work with the
-- activities table (referencing NEW.user_id), and recreated them on activities.
-- The stale triggers on users were never dropped, causing INSERT failures:
--   "record new has no field user_id"
-- Using IF EXISTS makes this safe on any environment (no-op if already absent).

DROP TRIGGER IF EXISTS trigger_update_school_totals ON users;
DROP TRIGGER IF EXISTS trigger_update_house_totals ON users;
