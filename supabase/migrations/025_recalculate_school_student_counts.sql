-- Recalculate school student counts based on actual signed-up users
-- This replaces arbitrary student numbers with real user counts

-- Update total_students in schools table based on actual user count
UPDATE schools 
SET total_students = (
    SELECT COUNT(*) 
    FROM users 
    WHERE users.school_id = schools.id
)
WHERE id IN (
    SELECT DISTINCT school_id 
    FROM users 
    WHERE school_id IS NOT NULL
);

-- Verification query (commented out for migration)
-- SELECT 
--     s.name as school_name,
--     s.total_students as updated_count,
--     COUNT(u.id) as actual_user_count
-- FROM schools s
-- LEFT JOIN users u ON u.school_id = s.id
-- GROUP BY s.id, s.name, s.total_students
-- ORDER BY s.name;