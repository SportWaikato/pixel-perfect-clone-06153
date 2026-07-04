-- Block privilege escalation via self-INSERT on public.users.
--
-- prevent_privileged_column_changes (20260702072116) only guards UPDATEs.
-- Profile creation happens client-side (onboarding, register-school, invite
-- registration) with a client-chosen role, so any authenticated auth user
-- without a profile row could INSERT themselves role='super_admin', or
-- 'school_admin' pointing at ANY existing school.
--
-- Rules enforced for self-inserts (auth.uid() = NEW.id):
--   * super_admin  → only with a live, unused super_admin_invite matching the
--                    caller's auth email (the /invite/$token flow).
--   * school_admin → only for a school that is not yet approved/active and has
--                    no school_admin yet (the /register-school flow).
--   * anything else must be 'student'.
-- Service-role / admin inserts (auth.uid() IS NULL or differs) are untouched.

CREATE OR REPLACE FUNCTION public.enforce_role_on_self_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.id THEN
    RETURN NEW; -- not a client self-insert
  END IF;

  IF NEW.role::text = 'super_admin' THEN
    SELECT u.email INTO caller_email FROM auth.users u WHERE u.id = auth.uid();
    IF NOT EXISTS (
      SELECT 1 FROM public.super_admin_invites i
      WHERE lower(i.email) = lower(caller_email)
        AND i.used_at IS NULL
        AND i.expires_at > NOW()
    ) THEN
      RAISE EXCEPTION 'super_admin registration requires a valid invite';
    END IF;
  ELSIF NEW.role::text = 'school_admin' THEN
    IF NEW.school_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = NEW.school_id
        AND COALESCE(s.status, 'pending') <> 'approved'
        AND NOT EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.school_id = s.id AND u.role::text = 'school_admin'
        )
    ) THEN
      RAISE EXCEPTION 'school_admin self-registration is only allowed for a new pending school';
    END IF;
  ELSIF NEW.role IS NOT NULL AND NEW.role::text <> 'student' THEN
    RAISE EXCEPTION 'invalid role for self-registration';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_role_on_self_insert ON public.users;
CREATE TRIGGER trg_enforce_role_on_self_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_role_on_self_insert();
