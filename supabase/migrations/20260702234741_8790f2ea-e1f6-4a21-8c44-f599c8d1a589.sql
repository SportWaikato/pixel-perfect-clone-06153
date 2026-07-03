
-- Revoke default PUBLIC execute on all SECURITY DEFINER functions in public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Signup / pre-auth flows: allow anon + authenticated
GRANT EXECUTE ON FUNCTION public.lookup_school_by_join_code(text)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(uuid, text)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_super_admin_invite(uuid)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.use_super_admin_invite(uuid, uuid) TO anon, authenticated;

-- Signed-in user helpers (functions enforce their own role checks)
GRANT EXECUTE ON FUNCTION public.get_school_join_code(uuid)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_term_points(text, uuid, uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rankings(uuid)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_feed_like(uuid)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_rankings()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_house_points()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_school_points()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_term_points(uuid)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_type_counts()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[])                TO authenticated;
GRANT EXECUTE ON FUNCTION public.hard_delete_user(uuid)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_house_totals_from_house(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_school_totals_from_school(uuid)        TO authenticated;

-- Trigger-only, privileged maintenance, and super-admin-only functions stay
-- with execute revoked from PUBLIC/anon/authenticated. They run either as
-- triggers (owner privileges) or via the service_role admin client.
