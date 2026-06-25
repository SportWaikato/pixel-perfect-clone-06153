-- SETUP SCRIPT: Replace the placeholders with your actual values
-- 
-- 1. First, run the seed data migration if you haven't already:
--    Run the contents of 002_seed_data.sql
--
-- 2. Find your auth user ID by running this query:
--    SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
--
-- 3. Get a school ID by running:
--    SELECT id, name FROM schools LIMIT 5;
--
-- 4. Get a house ID from your chosen school:
--    SELECT id, name, color FROM houses WHERE school_id = 'your-school-id';
--
-- 5. Then run this INSERT statement with your actual values:

/*
INSERT INTO users (
    id,                    -- Your auth.users.id from step 2
    username,              -- Choose a unique username
    first_name,            -- Your first name
    last_name,             -- Your last name
    school_id,             -- School ID from step 3
    house_id,              -- House ID from step 4
    year_group,            -- Optional: e.g., 'Year 6', 'Year 10', etc.
    is_admin,              -- Set to true if you want admin access
    is_public,             -- true if profile should be public
    total_kilometers       -- Starting kilometers (usually 0)
) VALUES (
    'your-auth-user-id-here',     -- Replace with actual auth user ID
    'your-username',              -- Replace with desired username
    'Your',                       -- Replace with your first name
    'Name',                       -- Replace with your last name
    'school-id-here',             -- Replace with actual school ID
    'house-id-here',              -- Replace with actual house ID
    'Year 6',                     -- Replace with your year group
    true,                         -- Set to false if not admin
    true,                         -- Set to false for private profile
    0.0                           -- Starting kilometers
);
*/

-- Example with placeholder values (DO NOT RUN AS-IS):
-- INSERT INTO users (id, username, first_name, last_name, school_id, house_id, year_group, is_admin, is_public, total_kilometers)
-- VALUES ('12345678-1234-1234-1234-123456789012', 'testuser', 'Test', 'User', 'school-id', 'house-id', 'Year 6', true, true, 0.0); 