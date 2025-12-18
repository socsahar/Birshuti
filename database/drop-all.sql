-- ==========================================
-- Drop All Database Objects
-- Use this to completely reset the database
-- ==========================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop views
DROP VIEW IF EXISTS profiles CASCADE;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS equipment_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ==========================================
-- Success!
-- Now you can run schema.sql to recreate everything
-- ==========================================
