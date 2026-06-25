-- Migration: Add is_active field to users table
-- Description: Adds an is_active boolean field to track user suspension/activation status

-- Add the is_active column to the users table
-- Default to true so existing users remain active
ALTER TABLE users 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Update any existing records to ensure they are marked as active
-- (This is redundant given the DEFAULT true, but explicit for clarity)
UPDATE users 
SET is_active = true 
WHERE is_active IS NULL;

-- Add a comment to document the field
COMMENT ON COLUMN users.is_active IS 'Indicates whether the user account is active (true) or suspended (false)';

-- Optional: Create an index for faster queries on active users
CREATE INDEX idx_users_is_active ON users(is_active);

-- Optional: Create a partial index for active users only (more efficient for common queries)
CREATE INDEX idx_users_active_only ON users(school_id, house_id) WHERE is_active = true; 