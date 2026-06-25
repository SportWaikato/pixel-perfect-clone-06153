-- Fix school_messages SELECT policy so super admins can read messages for
-- any school, not just the school their own user record belongs to.
-- Mirrors the fix applied to school_updates in migrations 060 and 061.

DROP POLICY IF EXISTS "School admins can view messages for their school" ON school_messages;

CREATE POLICY "School admins can view messages for their school"
  ON school_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );
