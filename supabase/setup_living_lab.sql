-- Check and fix the living-lab user
SELECT id, email, role, school_id, first_name, last_name 
FROM users 
WHERE email ILIKE '%living-lab%';

-- If the user exists and is super_admin but missing school fields, set them up:
-- UPDATE users SET school_id = NULL WHERE email ILIKE '%living-lab%' AND school_id IS NOT NULL;
-- Super admins don't need a school_id - remove it to skip onboarding

-- If the user needs school_id cleared (prevents onboarding redirect for super admins):
UPDATE users 
SET school_id = NULL, updated_at = NOW()
WHERE email ILIKE '%living-lab%' AND role = 'super_admin' AND school_id IS NOT NULL;
