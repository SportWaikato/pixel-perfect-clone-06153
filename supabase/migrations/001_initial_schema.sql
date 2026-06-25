-- Schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    total_students INTEGER DEFAULT 0,
    total_kilometers DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL, -- hex color
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    total_kilometers DECIMAL(10,2) DEFAULT 0
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username VARCHAR(50) UNIQUE NOT NULL,
    social_handle VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_icon_url TEXT,
    school_id UUID REFERENCES schools(id),
    house_id UUID REFERENCES houses(id),
    year_group VARCHAR(20),
    is_admin BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    total_kilometers DECIMAL(10,2) DEFAULT 0
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID, -- Optional, will add events table later
    activity_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER,
    distance_km DECIMAL(8,3) NOT NULL,
    feeling VARCHAR(20) NOT NULL CHECK (feeling IN ('happy', 'average', 'sad')),
    participation_type VARCHAR(20) NOT NULL CHECK (participation_type IN ('solo', 'with_others')),
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    house_points_awarded INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Users can view houses" ON houses FOR SELECT USING (true);
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view other users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can manage their activities" ON activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view all activities" ON activities FOR SELECT USING (true); 