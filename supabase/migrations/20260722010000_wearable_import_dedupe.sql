-- Wearable sync: de-duplication key for imported workouts.
--
-- Workouts pulled from Apple Health / Health Connect carry a stable platform
-- id. Storing it lets a re-sync skip sessions that were already imported, and
-- the unique index makes double-imports impossible even under concurrent
-- syncs. NULL for manually logged activities (uniqueness ignores NULLs).

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_user_external
  ON public.activities(user_id, external_id)
  WHERE external_id IS NOT NULL;
