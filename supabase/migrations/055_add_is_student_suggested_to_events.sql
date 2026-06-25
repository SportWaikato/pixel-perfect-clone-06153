ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_student_suggested boolean NOT NULL DEFAULT false;
