-- Migration: Fix Activity Type Aliases and Award Missing Badges
-- Date: 2025-08-18
-- Description: Updates badge criteria to use current activity types and retroactively awards badges

-- Step 1: Update cycling badge criteria to use current activity type
-- Find and update the "On your Bike" badge
UPDATE achievements 
SET criteria = jsonb_set(criteria, '{activity_type}', '"bike_cycle"')
WHERE name = 'On your Bike' 
  AND criteria->>'activity_type' = 'cycling'
  AND criteria->>'type' = 'specific_activity';

-- Step 2: Update VR/Gaming badge criteria to use current activity type  
-- Find and update the "Unlocked Technology" badge
UPDATE achievements 
SET criteria = jsonb_set(criteria, '{activity_type}', '"gamefit_vr"')
WHERE name = 'Unlocked Technology' 
  AND criteria->>'activity_type' = 'vr_gaming'
  AND criteria->>'type' = 'specific_activity';

-- Step 3: Create activity type aliases reference table for documentation
CREATE TABLE IF NOT EXISTS activity_type_aliases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_type VARCHAR(50) NOT NULL,
    alias_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(primary_type, alias_type)
);

-- Step 4: Insert all known activity type mappings for reference
INSERT INTO activity_type_aliases (primary_type, alias_type) VALUES
('bike_cycle', 'cycling'),
('cycling', 'bike_cycle'),
('gamefit_vr', 'vr_gaming'), 
('vr_gaming', 'gamefit_vr'),
('walk_hike', 'walking'),
('walking', 'walk_hike'),
('team_sport', 'team_sports'),
('team_sports', 'team_sport'),
('workout_gym', 'gym_fitness'),
('gym_fitness', 'workout_gym'),
('run_jog', 'running'),
('running', 'run_jog'),
('kapa_haka', 'dance'),
('dance', 'kapa_haka')
ON CONFLICT (primary_type, alias_type) DO NOTHING;

-- Step 5: Award cycling badges retroactively to all eligible users
-- Get the cycling badge ID first (should be the "On your Bike" badge)
DO $$
DECLARE
    cycling_badge_id UUID;
    vr_badge_id UUID;
    affected_cycling_users RECORD;
    affected_vr_users RECORD;
    cycling_count INTEGER := 0;
    vr_count INTEGER := 0;
BEGIN
    -- Find the cycling badge ID
    SELECT id INTO cycling_badge_id 
    FROM achievements 
    WHERE name = 'On your Bike' 
      AND criteria->>'type' = 'specific_activity';
    
    -- Find the VR gaming badge ID  
    SELECT id INTO vr_badge_id
    FROM achievements 
    WHERE name = 'Unlocked Technology'
      AND criteria->>'type' = 'specific_activity';

    -- Award cycling badges to users who have logged cycling activities
    IF cycling_badge_id IS NOT NULL THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at)
        SELECT DISTINCT 
            a.user_id,
            cycling_badge_id,
            MIN(a.created_at) as earned_at
        FROM activities a
        WHERE a.activity_type IN ('cycling', 'bike_cycle')
          AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = a.user_id 
              AND ua.achievement_id = cycling_badge_id
          )
        GROUP BY a.user_id
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        
        GET DIAGNOSTICS cycling_count = ROW_COUNT;
        RAISE NOTICE 'Awarded cycling badges to % users', cycling_count;
    END IF;

    -- Award VR gaming badges to users who have logged VR activities  
    IF vr_badge_id IS NOT NULL THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at)
        SELECT DISTINCT 
            a.user_id,
            vr_badge_id,
            MIN(a.created_at) as earned_at
        FROM activities a
        WHERE a.activity_type IN ('vr_gaming', 'gamefit_vr')
          AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = a.user_id 
              AND ua.achievement_id = vr_badge_id
          )
        GROUP BY a.user_id
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        
        GET DIAGNOSTICS vr_count = ROW_COUNT;
        RAISE NOTICE 'Awarded VR gaming badges to % users', vr_count;
    END IF;

    -- Update user points for newly awarded cycling badges
    IF cycling_badge_id IS NOT NULL AND cycling_count > 0 THEN
        UPDATE users 
        SET total_points = COALESCE(total_points, 0) + 15
        WHERE id IN (
            SELECT DISTINCT a.user_id
            FROM activities a
            WHERE a.activity_type IN ('cycling', 'bike_cycle')
              AND EXISTS (
                SELECT 1 FROM user_achievements ua 
                WHERE ua.user_id = a.user_id 
                  AND ua.achievement_id = cycling_badge_id
                  AND ua.earned_at >= NOW() - INTERVAL '1 minute'
              )
        );
        RAISE NOTICE 'Updated points for cycling badge recipients';
    END IF;

    -- Update user points for newly awarded VR badges  
    IF vr_badge_id IS NOT NULL AND vr_count > 0 THEN
        UPDATE users 
        SET total_points = COALESCE(total_points, 0) + 20
        WHERE id IN (
            SELECT DISTINCT a.user_id
            FROM activities a
            WHERE a.activity_type IN ('vr_gaming', 'gamefit_vr')
              AND EXISTS (
                SELECT 1 FROM user_achievements ua 
                WHERE ua.user_id = a.user_id 
                  AND ua.achievement_id = vr_badge_id
                  AND ua.earned_at >= NOW() - INTERVAL '1 minute'
              )
        );
        RAISE NOTICE 'Updated points for VR gaming badge recipients';
    END IF;

END $$;

-- Step 6: Add helpful comments for documentation
COMMENT ON TABLE activity_type_aliases IS 'Maps legacy activity type names to current naming conventions for backward compatibility in the achievements system';
COMMENT ON COLUMN activity_type_aliases.primary_type IS 'The primary activity type name';
COMMENT ON COLUMN activity_type_aliases.alias_type IS 'An alternative/legacy name that should be treated as equivalent';

-- Step 7: Create indexes for performance on the aliases table
CREATE INDEX IF NOT EXISTS idx_activity_type_aliases_primary ON activity_type_aliases(primary_type);
CREATE INDEX IF NOT EXISTS idx_activity_type_aliases_alias ON activity_type_aliases(alias_type);

-- Step 8: Log completion
DO $$
BEGIN
    RAISE NOTICE 'Activity type aliases migration completed successfully';
    RAISE NOTICE 'Updated badge criteria for cycling and VR gaming badges';  
    RAISE NOTICE 'Retroactively awarded badges to eligible users';
    RAISE NOTICE 'Updated user points for newly awarded badges';
END $$;