CREATE TABLE IF NOT EXISTS school_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  term_number INTEGER NOT NULL CHECK (term_number BETWEEN 1 AND 4),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT school_terms_unique UNIQUE (school_id, year, term_number)
);

ALTER TABLE school_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read school terms"
  ON school_terms FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins insert school terms"
  ON school_terms FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('school_admin', 'super_admin')
      AND (u.school_id = school_terms.school_id OR u.role = 'super_admin')
    )
  );

CREATE POLICY "Admins update school terms"
  ON school_terms FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('school_admin', 'super_admin')
      AND (u.school_id = school_terms.school_id OR u.role = 'super_admin')
    )
  );

CREATE POLICY "Admins delete school terms"
  ON school_terms FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('school_admin', 'super_admin')
      AND (u.school_id = school_terms.school_id OR u.role = 'super_admin')
    )
  );
