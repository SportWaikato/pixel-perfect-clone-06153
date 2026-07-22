-- International + nationwide-scale groundwork.
--
-- 1. schools gain country (ISO-3166 alpha-2) and an IANA timezone so term
--    logic and "today" calculations stop assuming Pacific/Auckland once
--    Australian (and other) schools onboard.
-- 2. reset_all_ended_terms(): bulk, idempotent term rollover. With hundreds
--    of schools nobody clicks a per-school reset button — a daily scheduled
--    call archives standings and zeroes term points for every school whose
--    current term has just ended. Lifetime points are NEVER touched: student
--    totals live in activities/users aggregates, house/school lifetime
--    accumulations in *_points columns other than term_points.
-- 3. apply_term_dates_template(): super admin pushes national term dates
--    (e.g. NZ Ministry of Education dates) to every active school in a
--    country/region in one call; schools that already set custom dates for
--    that year/term keep them.

-- ---------------------------------------------------------------------------
-- 1. Country + timezone
-- ---------------------------------------------------------------------------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'NZ',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland';

COMMENT ON COLUMN public.schools.country IS 'ISO-3166 alpha-2 country code (NZ, AU, ...)';
COMMENT ON COLUMN public.schools.timezone IS 'IANA timezone for term/date logic';

CREATE INDEX IF NOT EXISTS idx_schools_country ON public.schools(country);
CREATE INDEX IF NOT EXISTS idx_schools_region ON public.schools(region);
CREATE INDEX IF NOT EXISTS idx_school_terms_school_dates
  ON public.school_terms(school_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Bulk term rollover
-- ---------------------------------------------------------------------------
-- A term "has ended" for a school when, in the school's own timezone, today
-- is after the term's end_date. Idempotency: a school/term pair is skipped
-- once a term_points_history row exists for it.
CREATE OR REPLACE FUNCTION public.reset_all_ended_terms()
RETURNS TABLE (school_id uuid, term_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  r RECORD;
BEGIN
  -- Callable by super admins from the UI, or by the scheduler / service role
  -- (no auth.uid() in that context).
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_role FROM users WHERE id = auth.uid();
    IF v_role IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'Only super admins can run the bulk term reset';
    END IF;
  END IF;

  FOR r IN
    SELECT s.id AS s_id, t.id AS t_id
    FROM schools s
    JOIN school_terms t ON t.school_id = s.id
    WHERE s.is_active = true
      -- term ended, in the school's local timezone
      AND t.end_date < (now() AT TIME ZONE COALESCE(s.timezone, 'Pacific/Auckland'))::date
      -- most recently ended term only
      AND t.end_date = (
        SELECT MAX(t2.end_date) FROM school_terms t2
        WHERE t2.school_id = s.id
          AND t2.end_date < (now() AT TIME ZONE COALESCE(s.timezone, 'Pacific/Auckland'))::date
      )
      -- not already archived
      AND NOT EXISTS (
        SELECT 1 FROM term_points_history h
        WHERE h.school_id = s.id AND h.term_id = t.id
      )
      -- only bother when there is something to roll over
      AND (
        COALESCE((SELECT term_points FROM schools WHERE id = s.id), 0) > 0
        OR EXISTS (
          SELECT 1 FROM houses hh WHERE hh.school_id = s.id AND COALESCE(hh.term_points, 0) > 0
        )
      )
  LOOP
    INSERT INTO term_points_history (school_id, term_id, standings, school_term_points, reset_by)
    SELECT
      r.s_id,
      r.t_id,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'house_id', h.id, 'house_name', h.name,
            'house_color', h.color, 'term_points', COALESCE(h.term_points, 0)
          ) ORDER BY COALESCE(h.term_points, 0) DESC)
         FROM houses h WHERE h.school_id = r.s_id),
        '[]'::jsonb),
      COALESCE((SELECT term_points FROM schools WHERE id = r.s_id), 0),
      auth.uid();

    UPDATE houses SET term_points = 0 WHERE houses.school_id = r.s_id;
    UPDATE schools SET term_points = 0 WHERE id = r.s_id;

    school_id := r.s_id;
    term_id := r.t_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_all_ended_terms() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_all_ended_terms() TO authenticated;

-- Schedule the rollover daily at 16:00 UTC (≈ 4-5am NZ, 2-3am AEST) when
-- pg_cron is available. Safe to re-run; unschedules an existing job first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('reset-ended-terms')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-ended-terms');
    PERFORM cron.schedule(
      'reset-ended-terms',
      '0 16 * * *',
      $job$SELECT public.reset_all_ended_terms();$job$
    );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. National / regional term-date templates
-- ---------------------------------------------------------------------------
-- p_terms: [{"term_number":1,"start_date":"2027-02-01","end_date":"2027-04-09"}, ...]
-- Scope: all active schools, optionally narrowed by country and/or region.
-- Existing rows for (school, year, term_number) are left untouched so a
-- school's custom dates always win over the template.
CREATE OR REPLACE FUNCTION public.apply_term_dates_template(
  p_year integer,
  p_terms jsonb,
  p_country text DEFAULT NULL,
  p_region text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_inserted integer := 0;
  v_term jsonb;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can apply term templates';
  END IF;

  IF p_year < 2020 OR p_year > 2100 THEN
    RAISE EXCEPTION 'Invalid year';
  END IF;

  FOR v_term IN SELECT * FROM jsonb_array_elements(p_terms)
  LOOP
    IF (v_term->>'term_number')::int NOT BETWEEN 1 AND 4
       OR (v_term->>'start_date')::date >= (v_term->>'end_date')::date THEN
      RAISE EXCEPTION 'Invalid term entry: %', v_term;
    END IF;

    WITH ins AS (
      INSERT INTO school_terms (school_id, year, term_number, start_date, end_date, created_by)
      SELECT s.id, p_year, (v_term->>'term_number')::int,
             (v_term->>'start_date')::date, (v_term->>'end_date')::date, auth.uid()
      FROM schools s
      WHERE s.is_active = true
        AND (p_country IS NULL OR s.country = p_country)
        AND (p_region IS NULL OR s.region = p_region)
      ON CONFLICT (school_id, year, term_number) DO NOTHING
      RETURNING 1
    )
    SELECT v_inserted + count(*) INTO v_inserted FROM ins;
  END LOOP;

  RETURN v_inserted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_term_dates_template(integer, jsonb, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_term_dates_template(integer, jsonb, text, text) TO authenticated;
