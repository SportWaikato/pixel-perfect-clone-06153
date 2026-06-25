-- Add 7-day streak badge to achievements table
INSERT INTO achievements (name, description, icon_name, image_filename, criteria, points_reward)
VALUES (
    '7 Day Streak',
    '7 day streak',
    'flame',
    '7-day-streak.png',
    '{"type": "streak", "days": 7}',
    25
);