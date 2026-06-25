-- School updates: admin broadcasts to all students in their school
CREATE TABLE school_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user read tracking for school updates
CREATE TABLE school_update_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES school_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(update_id, user_id)
);

-- Student feedback / contact messages to school admins
CREATE TABLE school_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: school_updates
ALTER TABLE school_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view their school updates"
  ON school_updates FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "School admins can insert updates for their school"
  ON school_updates FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('school_admin', 'super_admin')
    )
  );

CREATE POLICY "School admins can update their school updates"
  ON school_updates FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('school_admin', 'super_admin')
    )
  );

CREATE POLICY "School admins can delete their school updates"
  ON school_updates FOR DELETE
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('school_admin', 'super_admin')
    )
  );

-- RLS: school_update_reads
ALTER TABLE school_update_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own update reads"
  ON school_update_reads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own update reads"
  ON school_update_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own update reads"
  ON school_update_reads FOR DELETE
  USING (user_id = auth.uid());

-- RLS: school_messages
ALTER TABLE school_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can view messages for their school"
  ON school_messages FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('school_admin', 'super_admin')
    )
  );

CREATE POLICY "Users can send messages to their school"
  ON school_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  );
