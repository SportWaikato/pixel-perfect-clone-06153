-- Migration 046: Add event publish/unpublish system
--
-- Adds is_published (admin toggle) and last_interaction_at (30-day inactivity timer)
-- to the events table. Existing approved events are backfilled as published.
-- A trigger keeps last_interaction_at fresh whenever an activity is logged for an event.
-- The auto_unpublish_stale_events() function is scheduled by migration 047 via pg_cron.

-- Add new columns
ALTER TABLE events
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN last_interaction_at TIMESTAMPTZ;

-- Backfill: existing approved, active events start as published
UPDATE events
SET
  is_published       = true,
  last_interaction_at = COALESCE(updated_at, created_at)
WHERE is_active = true
  AND approval_status = 'approved';

-- Trigger function: reset last_interaction_at when an activity is logged for an event
CREATE OR REPLACE FUNCTION update_event_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_id IS NOT NULL THEN
    UPDATE events
    SET last_interaction_at = NOW()
    WHERE id = NEW.event_id
      AND is_published = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_interaction_on_activity
AFTER INSERT ON activities
FOR EACH ROW
EXECUTE FUNCTION update_event_last_interaction();

-- Function: unpublish events with no activity or admin interaction in the past 30 days.
-- Returns the number of events unpublished.
-- Scheduled daily by migration 047 via pg_cron.
CREATE OR REPLACE FUNCTION auto_unpublish_stale_events()
RETURNS integer AS $$
DECLARE
  unpublished_count integer;
BEGIN
  UPDATE events
  SET
    is_published = false,
    updated_at   = NOW()
  WHERE is_published = true
    AND is_active = true
    AND approval_status = 'approved'
    AND (
      last_interaction_at IS NULL
      OR last_interaction_at < NOW() - INTERVAL '30 days'
    );

  GET DIAGNOSTICS unpublished_count = ROW_COUNT;
  RETURN unpublished_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
