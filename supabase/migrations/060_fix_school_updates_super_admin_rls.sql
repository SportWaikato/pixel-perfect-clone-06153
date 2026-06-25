-- Fix school_updates RLS policies so super admins can post to any school,
-- not just the school their own user record belongs to.

DROP POLICY IF EXISTS "School admins can insert updates for their school" ON school_updates;
DROP POLICY IF EXISTS "School admins can update their school updates" ON school_updates;
DROP POLICY IF EXISTS "School admins can delete their school updates" ON school_updates;

CREATE POLICY "School admins can insert updates for their school"
  ON school_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can update their school updates"
  ON school_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can delete their school updates"
  ON school_updates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );
