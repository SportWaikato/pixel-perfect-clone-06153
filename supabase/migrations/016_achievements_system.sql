-- Migration: Achievement System Implementation
-- Date: 2025-07-21
-- Description: Creates achievements and user_achievements tables with Sport Waikato challenge badges

-- Create achievements table
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    image_filename VARCHAR(255), -- Badge image file name in public/badges/
    criteria JSONB NOT NULL,
    points_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Insert all achievements (Sport Waikato challenges + existing achievements)
INSERT INTO achievements (name, description, icon_name, image_filename, criteria, points_reward) VALUES

-- Sport Waikato Challenge Badges (July 21-25, 2025)
(
    'Connect with Nature',
    'Spend 1hr being active in nature, connecting with the environment',
    'leaf',
    'connect-with-nature.png',
    '{"type": "time_in_nature", "duration_minutes": 60, "date_range": {"start": "2025-07-21", "end": "2025-07-25"}}',
    50
),
(
    'Hikitea te haa',
    'Complete the Hikitea te Haa yoga session',
    'heart',
    'hikitea-te-haa.png',
    '{"type": "specific_activity", "activity_type": "yoga", "duration_minutes": 5, "date_range": {"start": "2025-07-21", "end": "2025-07-25"}}',
    25
),
(
    '#Bring your mate',
    'Complete 40mins of activity with a friend',
    'users',
    'bring-your-mate.png',
    '{"type": "social_activity", "duration_minutes": 40, "participation_type": "with_others", "date_range": {"start": "2025-07-21", "end": "2025-07-25"}}',
    40
),
(
    'Walk and Talk',
    'Get to know someone new by inviting them on a 20min walk-and-talk',
    'message-circle',
    'walk-and-talk.png',
    '{"type": "walk_and_talk", "activity_type": "walking", "duration_minutes": 20, "participation_type": "with_others", "date_range": {"start": "2025-07-21", "end": "2025-07-25"}}',
    30
),

-- Activity Entry Count Badges
(
    'You''re smashing it!',
    '20 logged entries',
    'star',
    'youre-smashing-it-20-logged-entries.png',
    '{"type": "entry_count", "count": 20}',
    20
),
(
    'Movement Master',
    '50 logged entries',
    'target',
    'Movement-Master-50-logged-entries.png',
    '{"type": "entry_count", "count": 50}',
    50
),
(
    '100 Logged Entries',
    '100 logged entries',
    'star',
    '100-logged-entries.png',
    '{"type": "entry_count", "count": 100}',
    100
),

-- Challenge and Variety Badges
(
    'Challenge Accepted',
    'Accepting your first in-school challenge',
    'users',
    'accepting-your-first-in-school-challenge.png',
    '{"type": "first_challenge"}',
    25
),
(
    'Variety Champion',
    'Participating in 5 different activities over time',
    'zap',
    'participating-in-5-different-activities-over-time.png',
    '{"type": "activity_variety", "count": 5}',
    30
),

-- Activity Type Specific Badges
(
    'Team Sports Champ',
    'Logging a Team Sport',
    'users',
    'Team-Sports-Champ-Logging-a-Team-Sport.png',
    '{"type": "specific_activity", "activity_type": "team_sport"}',
    15
),
(
    'On your Bike',
    'Logging a bike/cycle',
    'award',
    'on-your-bike.png',
    '{"type": "specific_activity", "activity_type": "cycling"}',
    15
),
(
    'Unlocked Technology',
    'Logging VR/Gamefit',
    'zap',
    'Unlocked-Technology-logging-VR:Gamefit.png',
    '{"type": "specific_activity", "activity_type": "vr_gaming"}',
    20
),

-- Leaderboard Badge
(
    'Leaderboard',
    'You made the leaderboard',
    'trophy',
    'Leaderboard-You-made-the-leaderboard.png',
    '{"type": "leaderboard_entry"}',
    25
),

-- Streak Badges
(
    '10 Day Streak',
    '10 day streak',
    'flame',
    '10-day-streak.png',
    '{"type": "streak", "days": 10}',
    30
),
(
    '2 Week Streak',
    '2 week streak',
    'flame',
    '2-week-streak.png',
    '{"type": "streak", "days": 14}',
    40
),
(
    '20 Day Streak',
    '20 day streak',
    'flame',
    '20-day-streak.png',
    '{"type": "streak", "days": 20}',
    50
),
(
    '1 Month Streak',
    '1 month streak',
    'flame',
    '1-month-streak.png',
    '{"type": "streak", "days": 30}',
    75
),

-- Physical Activity Time Badges
(
    '20 Hour Club',
    '20hrs physical activity',
    'award',
    '20hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 1200}',
    20
),
(
    '30 Hour Club',
    '30hrs physical activity',
    'award',
    '30hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 1800}',
    30
),
(
    '40 Hour Club',
    '40hrs physical activity',
    'award',
    '40hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 2400}',
    40
),
(
    '50 Hour Club',
    '50hrs physical activity',
    'award',
    '50hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 3000}',
    50
),
(
    '80 Hour Club',
    '80hrs physical activity',
    'award',
    '80hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 4800}',
    80
),
(
    '100 Hour Club',
    '100hrs physical activity',
    'award',
    '100hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 6000}',
    100
),
(
    '200 Hour Club',
    '200hrs physical activity',
    'award',
    '200hrs-physical-activity.png',
    '{"type": "total_time", "minutes": 12000}',
    200
);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Anyone can view achievements (public read)
CREATE POLICY "Anyone can view achievements" ON achievements 
    FOR SELECT USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements 
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert user achievements (for automated awarding)
CREATE POLICY "System can insert user achievements" ON user_achievements 
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_achievements_active ON achievements(is_active);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);

-- Add comments for documentation
COMMENT ON TABLE achievements IS 'Stores all available achievements and their criteria';
COMMENT ON TABLE user_achievements IS 'Junction table tracking which achievements users have earned';
COMMENT ON COLUMN achievements.criteria IS 'JSON object defining the requirements to earn this achievement';
COMMENT ON COLUMN achievements.points_reward IS 'Points awarded when earning this achievement (future use)';
COMMENT ON COLUMN achievements.image_filename IS 'Badge image file name in public/badges/ folder for display';

-- Achievement Types Explanation:
-- time_in_nature: Activity must be walking/running for specified duration during date range
-- specific_activity: Activity must match specific type (with optional duration requirement)
-- social_activity: Activity must be done with others for specified duration during date range
-- walk_and_talk: Walking activity done with others for specified duration during date range
-- entry_count: User must have logged specified number of activities (checked via historical data)
-- total_time: User must have accumulated specified minutes of activity (checked via historical data)
-- streak: User must have consecutive days of activity (checked via historical data)
-- activity_variety: User must have logged specified number of different activity types (checked via historical data)
-- first_challenge: User must have participated in at least one event/challenge (checked via historical data)
-- leaderboard_entry: User must appear on a leaderboard (checked via historical data)

-- Note: Real-time achievements (time_in_nature, specific_activity, social_activity, walk_and_talk) 
-- are automatically checked when activities are logged.
-- Historical achievements (entry_count, total_time, streak, etc.) need to be checked manually 
-- using the "Check Earned" button on the dashboard or via the checkHistoricalAchievements action. 