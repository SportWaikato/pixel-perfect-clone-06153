
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.houses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.house_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_updates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_update_reads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_terms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.super_admin_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allowed_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assembly_draw_winners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.korero_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotional_assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surveys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_survey_status TO authenticated;
GRANT SELECT ON public.activity_type_aliases TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Anon needs to read schools for join-code/signup lookup and allowed_emails check
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.allowed_emails TO anon;
GRANT SELECT ON public.activity_type_aliases TO anon;
