-- Equity/demographic columns for equity-filtered reporting (MWYS/Voice of Rangatahi).
-- Optional fields — populated by schools/admins or derived from survey responses.
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disability_status TEXT;
