-- Replace the user-callable RPC with a service_role-only function
-- (called server-side from a Next.js server action, not from the browser)
DROP FUNCTION IF EXISTS public.get_user_emails_for_admin(uuid[]);

CREATE OR REPLACE FUNCTION public.get_user_emails_by_ids(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email FROM auth.users WHERE id = ANY(user_ids);
$$;

-- Only the service role may call this — not anonymous or authenticated browser clients
REVOKE EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) TO service_role;
