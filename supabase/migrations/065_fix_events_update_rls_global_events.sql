-- Fix: school admins could not update events with target_schools = NULL (global events).
-- Events inserted via seed migrations have created_by = NULL and target_schools = NULL,
-- so neither the "created_by = auth.uid()" nor the "school_id = ANY(target_schools)"
-- condition ever matched, silently blocking updates.
--
-- The correct semantic is that a global event (target_schools IS NULL) is visible to all
-- schools, so school admins should be able to edit it just as they can edit events
-- explicitly targeting their school.

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
