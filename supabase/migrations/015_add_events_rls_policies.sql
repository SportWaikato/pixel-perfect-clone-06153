-- Add missing RLS policies for events table to allow admins to create/manage events

-- Policy: Students can create pending events
CREATE POLICY "Students can create pending events" ON events
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND approval_status = 'pending'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'student'
        )
    );

-- Policy: School admins can create approved events for their school
CREATE POLICY "School admins can create events" ON events
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'school_admin' OR role = 'super_admin')
        )
    );

-- Policy: School admins can update events they created or events targeting their school
CREATE POLICY "School admins can update events" ON events
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'school_admin'
            AND school_id = ANY(target_schools)
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
            AND school_id = ANY(target_schools)
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Policy: Super admins can delete events
CREATE POLICY "Super admins can delete events" ON events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Policy: Event creators can update their own events (for status changes)
CREATE POLICY "Creators can update their events" ON events
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid()); 