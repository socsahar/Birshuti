-- ==========================================
-- Migration: Add Username Column
-- Converts system from email-based to username-based login
-- ==========================================

-- Add username column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add constraint for username format
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS username_format 
CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- For existing users: generate temporary usernames from email
-- You should manually update these to proper usernames
UPDATE profiles 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL;

-- Make username NOT NULL after setting values
ALTER TABLE profiles 
ALTER COLUMN username SET NOT NULL;

-- Update the trigger function to include username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, email, full_name, phone, merhav, role, volunteer_declaration)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'merhav', 'דן'),
        CASE 
            WHEN (NEW.raw_user_meta_data->>'volunteer_declaration')::boolean = TRUE 
            THEN 'pending_volunteer'::user_role
            ELSE 'user'::user_role
        END,
        COALESCE((NEW.raw_user_meta_data->>'volunteer_declaration')::boolean, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- IMPORTANT: Manual Steps Required
-- ==========================================
-- 
-- After running this migration:
-- 1. Update existing users' usernames to proper values
-- 2. Inform users of the new username-based login system
-- 3. Test login with usernames before deploying to production
--
-- Example update:
-- UPDATE profiles SET username = 'desired_username' WHERE email = 'user@example.com';
-- 
-- ==========================================
