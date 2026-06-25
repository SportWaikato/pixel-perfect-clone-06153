-- Migration: Add custom activity name support for "something else" entries
-- Date: 2025-09-29
-- Description: Allows users to provide custom labels when selecting the "something else" activity type.

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS custom_activity_name TEXT;

COMMENT ON COLUMN activities.custom_activity_name IS 'Optional custom label captured when activity_type is set to "something_else".';
