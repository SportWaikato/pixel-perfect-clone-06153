-- Add assembly flag to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_assembly BOOLEAN DEFAULT false;

-- Winners history log for spot prize draws
CREATE TABLE IF NOT EXISTS assembly_draw_winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  drawn_by UUID NOT NULL REFERENCES users(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_first_name TEXT NOT NULL,
  user_last_name TEXT NOT NULL,
  user_username TEXT NOT NULL,
  house_name TEXT,
  house_color TEXT
);

ALTER TABLE assembly_draw_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage assembly winners"
  ON assembly_draw_winners FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('school_admin', 'super_admin')
      AND (u.school_id = assembly_draw_winners.school_id OR u.role = 'super_admin')
    )
  );
