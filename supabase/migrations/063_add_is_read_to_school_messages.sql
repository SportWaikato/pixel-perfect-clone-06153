-- Add is_read flag to school_messages so admins can track which student
-- messages they have reviewed.

ALTER TABLE school_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Allow school admins and super admins to mark messages as read.
CREATE POLICY "School admins can update messages for their school"
  ON school_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );
