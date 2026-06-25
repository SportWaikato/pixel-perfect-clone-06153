-- Add role field to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student' 
CHECK (role IN ('student', 'school_admin', 'super_admin'));

-- Add school admin associations
CREATE TABLE school_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, school_id)
);

-- Add indexes for better performance
CREATE INDEX idx_school_admins_user_id ON school_admins(user_id);
CREATE INDEX idx_school_admins_school_id ON school_admins(school_id);

-- Add RLS policies for school_admins table
ALTER TABLE school_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view school admin associations for their school
CREATE POLICY "Users can view school admins for their school" ON school_admins
    FOR SELECT
    USING (
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Super admins can manage all school admin associations
CREATE POLICY "Super admins can manage school admins" ON school_admins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Policy: School admins can view their own associations
CREATE POLICY "School admins can view their own associations" ON school_admins
    FOR SELECT
    USING (user_id = auth.uid()); 