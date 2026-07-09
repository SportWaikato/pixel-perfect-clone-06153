-- Schema reconciliation: tables that exist on live but have no CREATE in repo migrations.
-- Generated 2026-07-09 from live DB zxxhjkruhwjondrbftaf via Management API.

-- === SURVEYS ===

CREATE TABLE IF NOT EXISTS surveys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    survey_type character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    question_text text NOT NULL,
    question_type character varying NOT NULL,
    answer_options jsonb DEFAULT '[]'::jsonb,
    display_order integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    question_id uuid NOT NULL,
    user_id uuid NOT NULL,
    answer jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_survey_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    survey_type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    triggered_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- === HOUSE ACHIEVEMENTS ===

CREATE TABLE IF NOT EXISTS house_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    achievement_id uuid,
    house_id uuid NOT NULL,
    school_id uuid NOT NULL,
    term_id uuid,
    achievement_name character varying NOT NULL,
    achievement_description text DEFAULT ''::text,
    icon_name character varying DEFAULT 'award'::character varying,
    image_filename character varying,
    storage_url text,
    criteria jsonb DEFAULT '{}'::jsonb,
    points_reward integer DEFAULT 0,
    house_name character varying DEFAULT ''::character varying NOT NULL,
    house_color character varying DEFAULT '#0B4B39'::character varying NOT NULL
);

-- === PRIMARY KEYS (IF NOT EXISTS) ===

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surveys_pkey') THEN
        ALTER TABLE surveys ADD PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_questions_pkey') THEN
        ALTER TABLE survey_questions ADD PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_responses_pkey') THEN
        ALTER TABLE survey_responses ADD PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_survey_status_pkey') THEN
        ALTER TABLE user_survey_status ADD PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'house_achievements_pkey') THEN
        ALTER TABLE house_achievements ADD PRIMARY KEY (id);
    END IF;
END;
$$;

-- === KEY RPC FUNCTIONS (not in repo migrations) ===
-- These exist on live and are called by frontend code. Captured for reproducibility.
-- Full definitions from live DB zxxhjkruhwjondrbftaf as of 2026-07-09.

-- Used by onboarding: /join/$code and join-code display
CREATE OR REPLACE FUNCTION public.lookup_school_by_join_code(p_join_code text)
 RETURNS TABLE(id uuid, name text, is_active boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.is_active
  FROM schools s
  WHERE s.join_code = p_join_code
    AND s.is_active = true
    AND s.join_link_active = true
  LIMIT 1;
END;
$function$;

-- Used by school admin dashboard for join-code display
CREATE OR REPLACE FUNCTION public.get_school_join_code(p_school_id uuid)
 RETURNS TABLE(code text, join_code text, join_link_active boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_user_school_id UUID;
BEGIN
  SELECT role, school_id INTO v_role, v_user_school_id FROM users WHERE id = auth.uid();
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_role = 'super_admin' OR (v_role = 'school_admin' AND v_user_school_id = p_school_id) THEN
    RETURN QUERY SELECT s.code, s.join_code, s.join_link_active FROM schools s WHERE s.id = p_school_id;
  ELSE
    RAISE EXCEPTION 'Only admins can view join codes';
  END IF;
END;
$function$;

-- Used by leaderboards, student progression card, assembly statistics
CREATE OR REPLACE FUNCTION public.get_term_points(p_entity_type text, p_entity_id uuid, p_term_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_school_id UUID;
  v_next_term_start DATE;
  v_effective_end DATE;
  v_points INTEGER;
BEGIN
  SELECT start_date, end_date, school_id
  INTO v_start_date, v_end_date, v_school_id
  FROM school_terms WHERE id = p_term_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  SELECT start_date INTO v_next_term_start
  FROM school_terms
  WHERE school_id = v_school_id AND start_date > v_start_date
  ORDER BY start_date ASC LIMIT 1;
  v_effective_end := COALESCE(v_next_term_start - INTERVAL '1 day', v_end_date);
  v_effective_end := v_effective_end::DATE;
  IF p_entity_type = 'user' THEN
    SELECT COALESCE(SUM(a.final_points), 0)::INTEGER INTO v_points
    FROM activities a
    WHERE a.user_id = p_entity_id
      AND a.created_at::DATE >= v_start_date
      AND a.created_at::DATE <= v_effective_end
      AND a.is_rejected IS NOT TRUE;
  ELSIF p_entity_type = 'house' THEN
    SELECT COALESCE(SUM(COALESCE(a.house_points_awarded, a.final_points)), 0)::INTEGER INTO v_points
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE u.house_id = p_entity_id
      AND a.created_at::DATE >= v_start_date
      AND a.created_at::DATE <= v_effective_end
      AND a.is_rejected IS NOT TRUE;
  ELSIF p_entity_type = 'school' THEN
    SELECT COALESCE(SUM(COALESCE(a.house_points_awarded, a.final_points)), 0)::INTEGER INTO v_points
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE u.school_id = p_entity_id
      AND a.created_at::DATE >= v_start_date
      AND a.created_at::DATE <= v_effective_end
      AND a.is_rejected IS NOT TRUE;
  ELSE
    v_points := 0;
  END IF;
  RETURN v_points;
END;
$function$;

-- Used by school admin settings
CREATE OR REPLACE FUNCTION public.reset_term_points(p_school_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_role TEXT; v_user_school_id UUID;
BEGIN
  SELECT role, school_id INTO v_role, v_user_school_id FROM users WHERE id = auth.uid();
  IF v_role IS NULL OR (v_role != 'super_admin' AND (v_role != 'school_admin' OR v_user_school_id != p_school_id)) THEN
    RAISE EXCEPTION 'Only admins of this school can reset term points';
  END IF;
  UPDATE houses SET term_points = 0 WHERE school_id = p_school_id;
  UPDATE schools SET term_points = 0 WHERE id = p_school_id;
END; $function$;

-- Used by school feed like feature
CREATE OR REPLACE FUNCTION public.increment_feed_like(p_activity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Must be signed in to like posts'; END IF;
  UPDATE activities SET feed_likes = COALESCE(feed_likes, 0) + 1 WHERE id = p_activity_id;
END; $function$;

-- Used by StudentProgressionCard for current term lookup
CREATE OR REPLACE FUNCTION public.get_current_term(p_school_id uuid)
 RETURNS school_terms
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_term school_terms%ROWTYPE;
BEGIN
  SELECT * INTO v_term FROM school_terms
  WHERE school_id = p_school_id AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
  ORDER BY start_date DESC LIMIT 1;
  IF FOUND THEN RETURN v_term; END IF;
  SELECT * INTO v_term FROM school_terms
  WHERE school_id = p_school_id AND start_date > CURRENT_DATE
  ORDER BY start_date ASC LIMIT 1;
  IF FOUND THEN RETURN v_term; END IF;
  SELECT * INTO v_term FROM school_terms
  WHERE school_id = p_school_id AND end_date < CURRENT_DATE
  ORDER BY end_date DESC LIMIT 1;
  RETURN v_term;
END;
$function$;

-- Used by dashboard for monthly progress
CREATE OR REPLACE FUNCTION public.get_user_current_month_progress(p_user_id uuid)
 RETURNS TABLE(current_month_minutes integer, current_month_points integer, current_month_activities integer, month_start date, days_in_month integer, days_remaining integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(a.duration_minutes), 0)::INTEGER,
    COALESCE(SUM(a.final_points), 0)::INTEGER,
    COUNT(*)::INTEGER,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER,
    EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - CURRENT_DATE))::INTEGER
  FROM activities a
  WHERE a.user_id = p_user_id
    AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND a.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$function$;
