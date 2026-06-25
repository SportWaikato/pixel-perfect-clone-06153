-- Migration: Fix Supabase security linter errors
-- 1. Recreate current_month_leaderboard view with security_invoker=true
--    so it respects the querying user's RLS policies rather than the creator's.
-- 2. Enable RLS on activity_type_aliases (lookup table — read-only for authenticated users).

-- Fix 1: security_definer_view on current_month_leaderboard
CREATE OR REPLACE VIEW public.current_month_leaderboard
WITH (security_invoker = true)
AS
WITH current_month_stats AS (
    SELECT
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.school_id,
        u.house_id,
        u.is_public,
        COALESCE(SUM(a.duration_minutes), 0) AS month_minutes,
        COALESCE(SUM(a.final_points), 0)     AS month_points,
        COUNT(a.id)                           AS month_activities
    FROM users u
    LEFT JOIN activities a ON
        a.user_id = u.id
        AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND a.created_at <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    GROUP BY u.id, u.username, u.first_name, u.last_name, u.school_id, u.house_id, u.is_public
)
SELECT
    *,
    DENSE_RANK() OVER (ORDER BY month_points DESC, month_minutes DESC) AS month_rank
FROM current_month_stats
WHERE month_points > 0
ORDER BY month_rank;

COMMENT ON VIEW public.current_month_leaderboard IS
'Dynamic view showing current month leaderboard that automatically resets each calendar month.
Rankings are based on points earned in the current month only.';

-- Fix 2: rls_disabled_in_public on activity_type_aliases
ALTER TABLE public.activity_type_aliases ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read the alias lookup table; no writes from client
CREATE POLICY "activity_type_aliases_read_authenticated"
    ON public.activity_type_aliases
    FOR SELECT
    TO authenticated
    USING (true);
