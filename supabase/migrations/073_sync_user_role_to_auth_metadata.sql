-- Migration 073: Sync user role into auth.users app_metadata
--
-- Purpose: Allow middleware to read the user's role directly from the JWT
-- (user.app_metadata.role) instead of querying the database on every request.
-- This removes a DB round-trip from every admin page navigation.
--
-- After this migration runs:
--   1. Any INSERT or UPDATE to public.users.role will automatically sync the
--      role into auth.users.raw_app_meta_data.
--   2. All existing users are backfilled in a single UPDATE.
--
-- The middleware still falls back to a DB query if app_metadata.role is absent
-- (e.g., for users created before this migration ran), so the rollout is safe.

-- Function: write role into auth metadata whenever public.users.role changes
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger: fires on INSERT and on any UPDATE that touches the role column
DROP TRIGGER IF EXISTS on_user_role_change ON public.users;
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_auth_metadata();

-- Backfill: write current roles into auth metadata for all existing users
UPDATE auth.users au
SET raw_app_meta_data =
  COALESCE(au.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', pu.role)
FROM public.users pu
WHERE au.id = pu.id
  AND pu.role IS NOT NULL;
