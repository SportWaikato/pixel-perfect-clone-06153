-- Allow super admins to update any user record
CREATE POLICY "Super admins can update users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow school admins to update users within their own school
CREATE POLICY "School admins can update their school users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin
      WHERE admin.id = auth.uid()
        AND admin.role = 'school_admin'
        AND admin.school_id = users.school_id
    )
  );
