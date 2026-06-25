-- Add columns needed for school self-registration and join link flow
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS school_type text CHECK (school_type IN ('Primary', 'Intermediate', 'Secondary', 'Full Primary')),
  ADD COLUMN IF NOT EXISTS secondary_email_domain text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS self_registered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS join_link_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Index for join_code lookups
CREATE INDEX IF NOT EXISTS idx_schools_join_code ON schools(join_code) WHERE join_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
