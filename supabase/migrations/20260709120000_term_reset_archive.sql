-- Term reset: archive final standings before zeroing, + audit trail.
--
-- The existing reset_term_points(school_id) simply zeroes houses.term_points and
-- schools.term_points. That preserves every student's activity history and
-- badges (those live in `activities` / `user_achievements`, untouched) — but it
-- throws away the record of who actually WON the term. This migration snapshots
-- the House standings into a history table first, so past terms are never lost,
-- and records who ran the reset.
--
-- Permissions and the student-history-preserving behaviour are unchanged:
-- super_admin, or the school_admin of that school, may reset; nothing in
-- `activities` or `user_achievements` is modified.

CREATE TABLE IF NOT EXISTS public.term_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.school_terms(id) ON DELETE SET NULL,
  -- [{house_id, house_name, house_color, term_points}, …] at reset time
  standings JSONB NOT NULL DEFAULT '[]'::jsonb,
  school_term_points INTEGER NOT NULL DEFAULT 0,
  reset_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_term_points_history_school ON public.term_points_history(school_id, reset_at DESC);

ALTER TABLE public.term_points_history ENABLE ROW LEVEL SECURITY;

-- Readable by the school's admins and super admins (for a "past terms" view).
DROP POLICY IF EXISTS term_points_history_read ON public.term_points_history;
CREATE POLICY term_points_history_read ON public.term_points_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.role::text = 'super_admin'
          OR (u.role::text = 'school_admin' AND u.school_id = term_points_history.school_id)
        )
    )
  );
-- Writes happen only inside the SECURITY DEFINER function below.
GRANT SELECT ON public.term_points_history TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_term_points(p_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_user_school_id UUID;
  v_term_id UUID;
  v_standings JSONB;
  v_school_pts INTEGER;
BEGIN
  SELECT role, school_id INTO v_role, v_user_school_id FROM users WHERE id = auth.uid();
  IF v_role IS NULL
     OR (v_role <> 'super_admin' AND (v_role <> 'school_admin' OR v_user_school_id <> p_school_id)) THEN
    RAISE EXCEPTION 'Only admins of this school can reset term points';
  END IF;

  -- Snapshot House standings + school total before zeroing.
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'house_id', h.id, 'house_name', h.name,
      'house_color', h.color, 'term_points', COALESCE(h.term_points, 0)
    ) ORDER BY COALESCE(h.term_points, 0) DESC), '[]'::jsonb)
  INTO v_standings
  FROM houses h WHERE h.school_id = p_school_id;

  SELECT COALESCE(term_points, 0) INTO v_school_pts FROM schools WHERE id = p_school_id;

  SELECT (public.get_current_term(p_school_id)).id INTO v_term_id;

  INSERT INTO term_points_history (school_id, term_id, standings, school_term_points, reset_by)
  VALUES (p_school_id, v_term_id, v_standings, COALESCE(v_school_pts, 0), auth.uid());

  -- Zero the competition points (student history + badges are untouched).
  UPDATE houses SET term_points = 0 WHERE school_id = p_school_id;
  UPDATE schools SET term_points = 0 WHERE id = p_school_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_term_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_term_points(uuid) TO authenticated;
