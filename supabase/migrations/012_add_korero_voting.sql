-- Create korero_votes table to track user interest
CREATE TABLE korero_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interest_level INTEGER NOT NULL CHECK (interest_level >= 1 AND interest_level <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One vote per user
);

-- Add indexes for performance
CREATE INDEX idx_korero_votes_user_id ON korero_votes(user_id);
CREATE INDEX idx_korero_votes_interest_level ON korero_votes(interest_level);
CREATE INDEX idx_korero_votes_created_at ON korero_votes(created_at);

-- Enable RLS
ALTER TABLE korero_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own votes" ON korero_votes 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON korero_votes 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON korero_votes 
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all votes" ON korero_votes 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Add comment for documentation
COMMENT ON TABLE korero_votes IS 'User votes on interest level for Kōrero chat feature'; 