-- Migration: Add proper monthly goal tracking
-- Purpose: Track monthly progress dynamically without resetting lifetime stats
-- Date: 2025-01-09

-- Create a function to get current month progress for a user
CREATE OR REPLACE FUNCTION get_user_current_month_progress(p_user_id UUID)
RETURNS TABLE (
    current_month_minutes INTEGER,
    current_month_points INTEGER,
    current_month_activities INTEGER,
    month_start DATE,
    days_in_month INTEGER,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(a.duration_minutes), 0)::INTEGER as current_month_minutes,
        COALESCE(SUM(a.final_points), 0)::INTEGER as current_month_points,
        COUNT(*)::INTEGER as current_month_activities,
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER as days_in_month,
        EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - CURRENT_DATE))::INTEGER as days_remaining
    FROM activities a
    WHERE a.user_id = p_user_id
    AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND a.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Create a function to get historical monthly data for a user
CREATE OR REPLACE FUNCTION get_user_monthly_history(
    p_user_id UUID,
    p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
    month DATE,
    total_minutes INTEGER,
    total_points INTEGER,
    activity_count INTEGER,
    active_days INTEGER,
    goal_minutes INTEGER,
    goal_completion_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH user_goal AS (
        SELECT monthly_goal_minutes 
        FROM users 
        WHERE id = p_user_id
    ),
    month_series AS (
        SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, p_months_back - 1))::DATE as month
    )
    SELECT 
        ms.month,
        COALESCE(SUM(a.duration_minutes), 0)::INTEGER as total_minutes,
        COALESCE(SUM(a.final_points), 0)::INTEGER as total_points,
        COUNT(a.id)::INTEGER as activity_count,
        COUNT(DISTINCT DATE(a.created_at))::INTEGER as active_days,
        ug.monthly_goal_minutes as goal_minutes,
        CASE 
            WHEN ug.monthly_goal_minutes > 0 THEN
                ROUND((COALESCE(SUM(a.duration_minutes), 0)::NUMERIC / ug.monthly_goal_minutes) * 100, 1)
            ELSE 0
        END as goal_completion_percent
    FROM month_series ms
    CROSS JOIN user_goal ug
    LEFT JOIN activities a ON 
        a.user_id = p_user_id AND
        DATE_TRUNC('month', a.created_at) = ms.month
    GROUP BY ms.month, ug.monthly_goal_minutes
    ORDER BY ms.month DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get school-wide monthly progress
CREATE OR REPLACE FUNCTION get_school_monthly_progress(p_school_id UUID)
RETURNS TABLE (
    month DATE,
    total_students INTEGER,
    active_students INTEGER,
    total_minutes INTEGER,
    total_points INTEGER,
    total_activities INTEGER,
    avg_minutes_per_student NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH current_month AS (
        SELECT DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start
    ),
    school_students AS (
        SELECT id FROM users WHERE school_id = p_school_id
    )
    SELECT 
        cm.month_start as month,
        (SELECT COUNT(*)::INTEGER FROM school_students) as total_students,
        COUNT(DISTINCT a.user_id)::INTEGER as active_students,
        COALESCE(SUM(a.duration_minutes), 0)::INTEGER as total_minutes,
        COALESCE(SUM(a.final_points), 0)::INTEGER as total_points,
        COUNT(a.id)::INTEGER as total_activities,
        CASE 
            WHEN COUNT(DISTINCT a.user_id) > 0 THEN
                ROUND(SUM(a.duration_minutes)::NUMERIC / COUNT(DISTINCT a.user_id), 1)
            ELSE 0
        END as avg_minutes_per_student
    FROM current_month cm
    LEFT JOIN activities a ON 
        a.user_id IN (SELECT id FROM school_students) AND
        a.created_at >= cm.month_start AND
        a.created_at < cm.month_start + INTERVAL '1 month'
    GROUP BY cm.month_start;
END;
$$ LANGUAGE plpgsql;

-- Create a view for current month leaderboard (resets monthly)
CREATE OR REPLACE VIEW current_month_leaderboard AS
WITH current_month_stats AS (
    SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.school_id,
        u.house_id,
        u.is_public,
        COALESCE(SUM(a.duration_minutes), 0) as month_minutes,
        COALESCE(SUM(a.final_points), 0) as month_points,
        COUNT(a.id) as month_activities
    FROM users u
    LEFT JOIN activities a ON 
        a.user_id = u.id AND
        a.created_at >= DATE_TRUNC('month', CURRENT_DATE) AND
        a.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    GROUP BY u.id, u.username, u.first_name, u.last_name, u.school_id, u.house_id, u.is_public
)
SELECT 
    *,
    DENSE_RANK() OVER (ORDER BY month_points DESC, month_minutes DESC) as month_rank
FROM current_month_stats
WHERE month_points > 0
ORDER BY month_rank;

-- Add a simple index for monthly queries (without the WHERE clause that uses CURRENT_DATE)
CREATE INDEX IF NOT EXISTS idx_activities_monthly_lookup 
ON activities(user_id, created_at DESC);

-- Add comment explaining the approach
COMMENT ON FUNCTION get_user_current_month_progress IS 
'Calculates current calendar month progress for a user dynamically from activities table. 
Automatically resets at the start of each month without affecting lifetime totals.';

COMMENT ON FUNCTION get_user_monthly_history IS 
'Returns historical monthly performance data for a user, including goal completion percentages.
Useful for showing progress trends over time.';

COMMENT ON VIEW current_month_leaderboard IS 
'Dynamic view showing current month leaderboard that automatically resets each calendar month.
Rankings are based on points earned in the current month only.';