-- Migration: Fix Leaderboard Points System
-- Date: 2025-08-04
-- Description: Creates triggers and functions to properly aggregate activity points to houses and updates leaderboard logic

-- =====================================================
-- PART 1: Add User Total Points Field
-- =====================================================

-- Add total_points field to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- =====================================================
-- PART 2: Create Functions to Update House Points
-- =====================================================

-- Function to update house total points when activities change
CREATE OR REPLACE FUNCTION update_house_points()
RETURNS TRIGGER AS $$
DECLARE
    user_house_id UUID;
BEGIN
    -- Handle INSERT, UPDATE, DELETE of activities
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update the user's house points if they belong to a house
        IF NEW.user_id IS NOT NULL THEN
            -- Get user's house_id
            SELECT house_id INTO user_house_id 
            FROM users 
            WHERE id = NEW.user_id;
            
            -- Update house total points if user belongs to a house
            IF user_house_id IS NOT NULL THEN
                UPDATE houses 
                SET total_points = (
                    SELECT COALESCE(SUM(a.final_points), 0)
                    FROM activities a
                    JOIN users u ON a.user_id = u.id
                    WHERE u.house_id = user_house_id
                )
                WHERE id = user_house_id;
                
                -- Also update user's total points
                UPDATE users 
                SET total_points = (
                    SELECT COALESCE(SUM(final_points), 0)
                    FROM activities 
                    WHERE user_id = NEW.user_id
                )
                WHERE id = NEW.user_id;
            END IF;
        END IF;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.user_id IS NOT NULL THEN
            -- Get user's house_id
            SELECT house_id INTO user_house_id 
            FROM users 
            WHERE id = OLD.user_id;
            
            -- Update house total points if user belongs to a house
            IF user_house_id IS NOT NULL THEN
                UPDATE houses 
                SET total_points = (
                    SELECT COALESCE(SUM(a.final_points), 0)
                    FROM activities a
                    JOIN users u ON a.user_id = u.id
                    WHERE u.house_id = user_house_id
                )
                WHERE id = user_house_id;
                
                -- Also update user's total points
                UPDATE users 
                SET total_points = (
                    SELECT COALESCE(SUM(final_points), 0)
                    FROM activities 
                    WHERE user_id = OLD.user_id
                )
                WHERE id = OLD.user_id;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for house points updates
DROP TRIGGER IF EXISTS trigger_update_house_points ON activities;
CREATE TRIGGER trigger_update_house_points
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_house_points();

-- =====================================================
-- PART 3: Create Manual Recalculation Functions
-- =====================================================

-- Function to recalculate all house points from scratch
CREATE OR REPLACE FUNCTION recalculate_house_points()
RETURNS void AS $$
BEGIN
    -- Update all house total points
    UPDATE houses 
    SET total_points = (
        SELECT COALESCE(SUM(a.final_points), 0)
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.house_id = houses.id
    );
    
    -- Update all user total points
    UPDATE users 
    SET total_points = (
        SELECT COALESCE(SUM(final_points), 0)
        FROM activities 
        WHERE user_id = users.id
    );
    
    RAISE NOTICE 'House and user points recalculated successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate school points (sum of house points)
CREATE OR REPLACE FUNCTION recalculate_school_points()
RETURNS void AS $$
BEGIN
    -- Add total_points field to schools if it doesn't exist
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
    
    -- Update all school total points
    UPDATE schools 
    SET total_points = (
        SELECT COALESCE(SUM(h.total_points), 0)
        FROM houses h
        WHERE h.school_id = schools.id
    );
    
    RAISE NOTICE 'School points recalculated successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: Run Initial Recalculation
-- =====================================================

-- Execute the recalculation functions to fix existing data
SELECT recalculate_house_points();
SELECT recalculate_school_points();

-- =====================================================
-- PART 5: Create Indexes for Performance
-- =====================================================

-- Add indexes to improve leaderboard query performance
CREATE INDEX IF NOT EXISTS idx_houses_total_points ON houses(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_schools_total_points ON schools(total_points DESC);

-- =====================================================
-- VERIFICATION QUERIES (commented out)
-- =====================================================

-- Uncomment these to verify the migration worked:
-- SELECT 'House Points:' as table_name, name, total_points FROM houses ORDER BY total_points DESC;
-- SELECT 'User Points:' as table_name, first_name, last_name, total_points FROM users ORDER BY total_points DESC LIMIT 10;
-- SELECT 'School Points:' as table_name, name, total_points FROM schools ORDER BY total_points DESC;