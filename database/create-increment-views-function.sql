-- Create a stored function for atomically incrementing listing views
-- This prevents race conditions when multiple users view the same listing simultaneously
-- Run this migration in your Supabase SQL editor

CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE listings 
    SET views = views + 1 
    WHERE id = listing_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO authenticated;

-- Grant execute permission to anonymous users (for public listings)
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO anon;

-- Add a comment to document the function
COMMENT ON FUNCTION increment_listing_views(UUID) IS 'Atomically increments the view count for a listing';
