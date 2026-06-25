-- Add missing RLS policies for houses table to allow admins to create/manage houses

-- Policy: School admins can create houses for their own school
CREATE POLICY "School admins can create houses" ON houses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'school_admin' OR role = 'super_admin')
            AND (role = 'super_admin' OR school_id = houses.school_id)
        )
    );

-- Policy: School admins can update houses in their own school; super admins can update any
CREATE POLICY "School admins can update houses" ON houses
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'school_admin' OR role = 'super_admin')
            AND (role = 'super_admin' OR school_id = houses.school_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'school_admin' OR role = 'super_admin')
            AND (role = 'super_admin' OR school_id = houses.school_id)
        )
    );

-- Policy: School admins can delete houses in their own school; super admins can delete any
CREATE POLICY "School admins can delete houses" ON houses
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'school_admin' OR role = 'super_admin')
            AND (role = 'super_admin' OR school_id = houses.school_id)
        )
    );
