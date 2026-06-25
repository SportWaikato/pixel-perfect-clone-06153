-- Add optional class field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS class VARCHAR(100);
