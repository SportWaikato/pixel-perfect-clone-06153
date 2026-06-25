-- Add ranking cache fields to users table
ALTER TABLE users 
ADD COLUMN school_rank INTEGER DEFAULT NULL,
ADD COLUMN house_rank INTEGER DEFAULT NULL,
ADD COLUMN year_group_rank INTEGER DEFAULT NULL,
ADD COLUMN overall_rank INTEGER DEFAULT NULL;

-- Add indexes for better query performance on ranking fields
CREATE INDEX IF NOT EXISTS idx_users_school_rank ON users(school_rank);
CREATE INDEX IF NOT EXISTS idx_users_house_rank ON users(house_rank);
CREATE INDEX IF NOT EXISTS idx_users_year_group_rank ON users(year_group_rank);
CREATE INDEX IF NOT EXISTS idx_users_overall_rank ON users(overall_rank);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_school_total_km ON users(school_id, total_kilometers DESC);
CREATE INDEX IF NOT EXISTS idx_users_house_total_km ON users(house_id, total_kilometers DESC);
CREATE INDEX IF NOT EXISTS idx_users_year_group_total_km ON users(school_id, year_group, total_kilometers DESC);

-- Add comments for documentation
COMMENT ON COLUMN users.school_rank IS 'Cached ranking within school based on total_kilometers';
COMMENT ON COLUMN users.house_rank IS 'Cached ranking within house based on total_kilometers';
COMMENT ON COLUMN users.year_group_rank IS 'Cached ranking within year group based on total_kilometers';
COMMENT ON COLUMN users.overall_rank IS 'Cached ranking across all users based on total_kilometers';