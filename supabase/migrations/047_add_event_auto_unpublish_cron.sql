-- Migration 047: Schedule daily auto-unpublish of stale events via pg_cron
--
-- PREREQUISITE: The pg_cron extension must be enabled in the Supabase Dashboard
-- before running this migration.
-- Path: Supabase Dashboard > Database > Extensions > pg_cron > Enable
--
-- This migration schedules auto_unpublish_stale_events() (created in migration 046)
-- to run once daily at 2am UTC. Events that have had no activity logged and no admin
-- edits/publish actions in the past 30 days will be automatically unpublished.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'auto-unpublish-stale-events',  -- job name (must be unique)
  '0 2 * * *',                    -- daily at 2am UTC
  'SELECT auto_unpublish_stale_events()'
);
