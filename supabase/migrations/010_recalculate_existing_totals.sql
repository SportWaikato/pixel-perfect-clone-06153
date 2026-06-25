-- Recalculate all school totals from existing user data
UPDATE schools 
SET total_kilometers = (
    SELECT COALESCE(SUM(u.total_kilometers), 0) 
    FROM users u 
    WHERE u.school_id = schools.id
);

-- Recalculate all house totals from existing user data
UPDATE houses 
SET total_kilometers = (
    SELECT COALESCE(SUM(u.total_kilometers), 0) 
    FROM users u 
    WHERE u.house_id = houses.id
); 