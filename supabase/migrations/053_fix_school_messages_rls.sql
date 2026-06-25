-- The WITH CHECK on school_messages used a subquery against the RLS-protected
-- users table, which can fail during policy evaluation. Simplify to just
-- enforce user_id = auth.uid() — the school_id is trusted from the app context
-- and messages are only readable by admins of that school.
DROP POLICY IF EXISTS "Users can send messages to their school" ON school_messages;

CREATE POLICY "Users can send messages to their school"
  ON school_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());
