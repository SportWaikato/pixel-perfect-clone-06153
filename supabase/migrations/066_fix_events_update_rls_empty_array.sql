-- Fix: school admins could not update global events (target_schools = NULL or []).
-- Seed events have created_by = NULL and target_schools = [] (empty array), so neither
-- "created_by = auth.uid()" nor "school_id = ANY(target_schools)" ever matched —
-- Supabase silently blocked the UPDATE, returning no error and 0 rows affected.
--
-- The app treats both NULL and [] as "visible to all schools" (matching the TypeScript
-- filter: !target_schools || target_schools.length === 0). The RLS policy now mirrors
-- that logic: school admins can update any event that is global OR targets their school.

DROP POLICY IF EXISTS "School admins can update events" ON events;

CREATE POLICY "School admins can update events" ON events
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'school_admin'
            AND (
                target_schools IS NULL
                OR cardinality(target_schools) = 0
                OR school_id = ANY(target_schools)
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'school_admin'
            AND (
                target_schools IS NULL
                OR cardinality(target_schools) = 0
                OR school_id = ANY(target_schools)
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );
