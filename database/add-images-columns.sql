-- ==========================================
-- Migration: Add image columns to listings table
-- Date: December 18, 2025
-- ==========================================

-- Add image columns to listings table
ALTER TABLE listings 
ADD COLUMN image1 TEXT,
ADD COLUMN image2 TEXT;

-- Add comments
COMMENT ON COLUMN listings.image1 IS 'Path to first uploaded image';
COMMENT ON COLUMN listings.image2 IS 'Path to second uploaded image';
