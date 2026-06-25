-- Create Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_distance DECIMAL(8,2),
    is_active BOOLEAN DEFAULT true,
    participant_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view events" ON events FOR SELECT USING (true);

-- Insert sample events
INSERT INTO events (name, description, event_type, start_date, end_date, target_distance, participant_count) VALUES
('Spring Running Challenge', 'Complete as many kilometers as you can in 30 days to earn your school points on the leaderboard.', 'running', '2025-05-01', '2025-05-30', 100.0, 254),
('Cycling Weekend', 'Join students from across the district for a weekend of cycling activities.', 'cycling', '2025-06-07', '2025-06-08', 50.0, 120),
('Marathon Prep', 'Training program for the upcoming city marathon. Track your progress and prepare alongside other students.', 'running', '2025-06-15', '2025-07-15', 150.0, 89),
('Winter Sports Festival', 'A celebration of winter sports and activities. Log any type of physical activity to contribute to your school''s score.', 'mixed', '2025-07-01', '2025-07-31', NULL, 350);