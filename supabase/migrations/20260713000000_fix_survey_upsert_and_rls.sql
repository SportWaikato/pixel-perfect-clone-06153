-- Fix survey_responses upsert + RLS policies for survey tables
-- survey_responses lacks a UNIQUE(user_id, question_id) constraint,
-- but SurveyService.submitSurvey() uses .upsert({ onConflict: "user_id,question_id" }).
-- PostgreSQL rejects the upsert because no matching constraint exists.

ALTER TABLE public.survey_responses
  ADD CONSTRAINT survey_responses_user_question_unique
  UNIQUE (user_id, question_id);

-- RLS policies for survey tables
-- These tables had table-level GRANTs but no row-level policies.
-- Without policies, even authenticated users cannot insert/update their own rows
-- because RLS defaults to "deny all".

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_survey_status ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read surveys and questions
CREATE POLICY "Authenticated users can read surveys"
  ON public.surveys FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read survey questions"
  ON public.survey_questions FOR SELECT TO authenticated
  USING (true);

-- Users can only insert/update their own responses
CREATE POLICY "Users can insert own responses"
  ON public.survey_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON public.survey_responses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own responses"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can manage their own survey status rows
CREATE POLICY "Users can insert own survey status"
  ON public.user_survey_status FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own survey status"
  ON public.user_survey_status FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own survey status"
  ON public.user_survey_status FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
