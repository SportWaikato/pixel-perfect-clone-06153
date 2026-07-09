-- Add roll_number column to schools table.
-- Used in pro-rata leaderboard scoring: (points / roll_number) × 100.
-- Falls back to total_students (registered users) if roll_number is NULL.
-- This lets schools compete on their actual student body size, incentivising wider adoption.
ALTER TABLE schools ADD COLUMN IF NOT EXISTS roll_number INTEGER;
