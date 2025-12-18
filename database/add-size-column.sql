-- ==========================================
-- Migration: Add size column to listings table
-- Date: December 18, 2025
-- ==========================================

-- Add size column to listings table
ALTER TABLE listings 
ADD COLUMN size TEXT;

-- Add comment
COMMENT ON COLUMN listings.size IS 'Size of the item (Young, Small, Medium, Large, XL, 2XL, 3XL, 4XL)';
