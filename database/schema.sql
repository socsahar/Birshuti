-- ==========================================
-- ברשותי (Birshuti) - Database Schema
-- Platform for MDA volunteers equipment sharing
-- ==========================================

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'pending_volunteer', 'verified_volunteer', 'admin');
CREATE TYPE transaction_type AS ENUM ('מסירה', 'השאלה', 'החלפה');

-- ==========================================
-- Table: users (authentication)
-- Core user authentication with hashed passwords
-- ==========================================
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    merhav TEXT NOT NULL, -- מרחב (area)
    role user_role NOT NULL DEFAULT 'user',
    volunteer_declaration BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- Add self-referencing foreign key after table creation
ALTER TABLE users 
ADD CONSTRAINT users_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES users(id);

-- Create alias view for backwards compatibility
CREATE VIEW profiles AS SELECT * FROM users;

-- ==========================================
-- Table: equipment_categories
-- Predefined equipment categories
-- ==========================================
CREATE TABLE equipment_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_he TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO equipment_categories (name_he, sort_order) VALUES
    ('חולצות', 1),
    ('מעילים', 2),
    ('פליזים', 3),
    ('מכנסיים', 4),
    ('נעליים', 5),
    ('אחר', 6);

-- ==========================================
-- Table: listings
-- Equipment listings created by users
-- ==========================================
CREATE TABLE listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    transaction_type transaction_type NOT NULL,
    size TEXT, -- Size: Young, Small, Medium, Large, XL, 2XL, 3XL, 4XL
    merhav TEXT NOT NULL, -- מרחב (area)
    image1 TEXT, -- Path to first uploaded image
    image2 TEXT, -- Path to second uploaded image
    is_available BOOLEAN DEFAULT TRUE,
    volunteer_only BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0 NOT NULL, -- Number of times listing has been viewed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Table: audit_log
-- Track admin actions for security
-- ==========================================
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Indexes for performance
-- ==========================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_listings_owner ON listings(owner_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_merhav ON listings(merhav);
CREATE INDEX idx_listings_volunteer_only ON listings(volunteer_only);
CREATE INDEX idx_listings_available ON listings(is_available);
CREATE INDEX idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ==========================================
-- Function: Update updated_at timestamp
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Sessions table for JWT tokens (optional)
-- ==========================================
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ==========================================
-- Comments for documentation
-- ==========================================
COMMENT ON TABLE users IS 'User accounts with role-based access control and hashed passwords';
COMMENT ON TABLE listings IS 'Equipment listings published by verified volunteers';
COMMENT ON TABLE audit_log IS 'Security audit trail for admin actions';
COMMENT ON TABLE sessions IS 'Active user sessions with JWT tokens';
COMMENT ON COLUMN users.volunteer_declaration IS 'Whether user declared they are an active MDA volunteer';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never expose this';
COMMENT ON COLUMN listings.volunteer_only IS 'If true, only verified volunteers can see this listing';
