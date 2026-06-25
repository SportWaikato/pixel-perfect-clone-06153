-- Add youtube_video_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

-- Add index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_events_youtube_video_url ON events(youtube_video_url);

-- Add constraint to ensure URL is valid YouTube format (optional but recommended)
ALTER TABLE events ADD CONSTRAINT check_youtube_url 
CHECK (
  youtube_video_url IS NULL OR 
  youtube_video_url ~ '^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[a-zA-Z0-9_-]+(&.*)?$'
); 