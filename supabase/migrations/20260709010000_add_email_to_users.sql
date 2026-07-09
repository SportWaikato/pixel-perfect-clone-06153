-- Store email on the users profile row so the profile page, admin tables, and
-- welcome emails don't need to cross-reference auth.users (which is RLS-gated).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill from auth.users for existing profiles (one-off).
UPDATE users u SET email = au.email
FROM auth.users au
WHERE au.id = u.id AND u.email IS NULL;
