-- Returns { id, email } rows from auth.users for the given user IDs.
-- SECURITY DEFINER lets it read auth.users; the inner check ensures
-- only school_admin / super_admin can invoke it.
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM users WHERE users.id = auth.uid();
  IF caller_role NOT IN ('school_admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT u.id, u.email
    FROM auth.users u
    WHERE u.id = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_emails_for_admin(uuid[]) TO authenticated;
