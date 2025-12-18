-- ==========================================
-- Create First Admin User
-- ==========================================
-- This script creates the first admin user for the platform
-- Credentials: admin / 240397Sm!
-- 
-- IMPORTANT: Run this AFTER the user signs up through the registration form
-- ==========================================

-- First, register the user through the website:
-- Username: admin
-- Email: admin@birshuti.local (or any email)
-- Password: 240397Sm!
-- Full Name: System Administrator
-- Merhav: Any

-- Then run this SQL to promote them to admin:
-- Replace 'admin' with the actual username if different

UPDATE users 
SET 
    role = 'admin',
    volunteer_declaration = TRUE,
    approved_at = NOW(),
    approved_by = id
WHERE username = 'admin';

-- Verify the admin was created
SELECT id, username, email, full_name, role, created_at
FROM users
WHERE username = 'admin';

-- ==========================================
-- Alternative: Direct insert (if profile doesn't exist)
-- ==========================================
-- If you need to create the admin directly in the database:
-- 
-- 1. First create the auth user via Supabase dashboard or API
-- 2. Get the user's UUID from auth.users table
-- 3. Run this (replace the UUID and username):
--
-- INSERT INTO users (username, email, password_hash, full_name, merhav, role, volunteer_declaration, approved_at)
-- VALUES (
--     'admin',
--     'admin@birshuti.local',
--     '$2b$10$HASHED_PASSWORD_HERE', -- Use bcrypt to hash '240397Sm!' first
--     'System Administrator',
--     'דן',
--     'admin',
--     TRUE,
--     NOW()
-- );
-- 
-- To hash the password, run this in Node.js:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('240397Sm!', 10).then(hash => console.log(hash));
