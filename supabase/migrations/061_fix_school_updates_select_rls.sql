-- Fix SELECT policy on school_updates so super admins can read any row.
-- Without this, INSERT ... RETURNING fails for super admins because the
-- RETURNING clause is subject to the SELECT policy.

DROP POLICY IF EXISTS "School members can view their school updates" ON school_updates;

CREATE POLICY "School members can view their school updates"
  ON school_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  );
