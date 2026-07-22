-- Server-side entry point for logging a workout synced from a wearable
-- (Apple Health / Health Connect). Both the future native app and any web
-- caller go through this one function so points are computed identically and
-- de-duplication is guaranteed.
--
-- Enforces the same guards as the app's ActivityService.create:
--   * duration 1..180 minutes
--   * activity dated within the last 7 days
--   * per-day total minutes cap (900)
-- Points: base = round(duration/60 * 60) = duration; final = base (no event).
-- De-dupe: relies on the unique (user_id, external_id) index — a repeat sync
-- of the same workout is a no-op that returns the existing row id.

CREATE OR REPLACE FUNCTION public.log_wearable_activity(
  p_external_id text,
  p_activity_type text,
  p_duration_minutes integer,
  p_started_at timestamptz,
  p_distance_km double precision DEFAULT 0,
  p_source text DEFAULT 'wearable'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_day_minutes integer;
  v_base integer;
  v_activity_id uuid;
  v_nz_date date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_external_id IS NULL OR length(p_external_id) = 0 THEN
    RAISE EXCEPTION 'external_id required';
  END IF;
  IF p_duration_minutes IS NULL OR p_duration_minutes < 1 OR p_duration_minutes > 180 THEN
    RAISE EXCEPTION 'duration_minutes must be between 1 and 180';
  END IF;
  IF p_started_at < now() - interval '7 days' THEN
    RAISE EXCEPTION 'activity must be within the last 7 days';
  END IF;

  -- Idempotent: already imported → return the existing row.
  SELECT id INTO v_existing_id
  FROM activities
  WHERE user_id = v_user_id AND external_id = p_external_id;
  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Per-day cap, in NZ calendar terms (matches the app's fixed +12 handling
  -- closely enough for the guard; refine per-school timezone if needed).
  v_nz_date := (p_started_at AT TIME ZONE 'Pacific/Auckland')::date;
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_day_minutes
  FROM activities
  WHERE user_id = v_user_id
    AND (created_at AT TIME ZONE 'Pacific/Auckland')::date = v_nz_date;

  IF v_day_minutes + p_duration_minutes > 900 THEN
    RAISE EXCEPTION 'daily minute cap exceeded';
  END IF;

  v_base := round((p_duration_minutes::numeric / 60) * 60);

  INSERT INTO activities (
    user_id, activity_type, duration_minutes, distance_km,
    feeling, participation_type, input_type, description,
    base_points, final_points, house_points_awarded, challenge_points_multiplier,
    external_id, created_at
  ) VALUES (
    v_user_id, p_activity_type, p_duration_minutes, COALESCE(p_distance_km, 0),
    'happy', 'solo', 'device_sync',
    CASE WHEN p_source = 'apple_health' THEN 'Synced from Apple Health'
         WHEN p_source = 'google_health_connect' THEN 'Synced from Health Connect'
         ELSE 'Synced from wearable' END,
    v_base, v_base, v_base, 1.0,
    p_external_id, p_started_at
  )
  ON CONFLICT (user_id, external_id) WHERE external_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_activity_id;

  -- Lost the race to a concurrent identical sync → return the winner's id.
  IF v_activity_id IS NULL THEN
    SELECT id INTO v_activity_id
    FROM activities WHERE user_id = v_user_id AND external_id = p_external_id;
    RETURN v_activity_id;
  END IF;

  -- Keep streaks current (achievements are evaluated on next app open).
  BEGIN
    PERFORM public.update_user_streak_for_date(v_user_id, v_nz_date);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- streak update is best-effort; never fail the log on it
  END;

  RETURN v_activity_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_wearable_activity(text, text, integer, timestamptz, double precision, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_wearable_activity(text, text, integer, timestamptz, double precision, text) TO authenticated;
