-- Add views counter to listings table
-- Run this migration in your Supabase SQL editor

ALTER TABLE listings 
ADD COLUMN views INTEGER DEFAULT 0 NOT NULL;

-- Create index for better performance when sorting by views
CREATE INDEX idx_listings_views ON listings(views);

-- Add a comment to document the column
COMMENT ON COLUMN listings.views IS 'Number of times this listing has been viewed';
