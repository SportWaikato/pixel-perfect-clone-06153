-- Add email_domain column to schools table and super admin management policy
-- email_domain restricts student registration to official school email addresses.
-- Super admin policy allows create/edit/delete of schools via the UI.

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS email_domain VARCHAR(255) NULL;

COMMENT ON COLUMN schools.email_domain IS 'The approved email domain for student registration (e.g. hamilton.co.nz). When set, students must use an email address matching this domain to register.';

CREATE POLICY "Super admins can manage schools" ON schools
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );
