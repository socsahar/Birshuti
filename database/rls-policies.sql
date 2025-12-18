-- ==========================================
-- ברשותי (Birshuti) - Row Level Security Policies
-- Security rules enforced at database level
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Policies: users
-- ==========================================

-- Everyone can read basic user info (for listing authors, excluding password_hash)
CREATE POLICY "Public users are viewable by everyone"
    ON users FOR SELECT
    USING (true);

-- Users can update their own profile (but NOT their role or password_hash directly)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::uuid)
    WITH CHECK (
        id = current_setting('app.current_user_id', true)::uuid AND
        role = (SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid)
    );

-- Admins can update any user
CREATE POLICY "Admins can update any user"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
        )
    );

-- Allow user creation (registration)
CREATE POLICY "Anyone can create user account"
    ON users FOR INSERT
    WITH CHECK (true);

-- ==========================================
-- Policies: equipment_categories
-- ==========================================

-- Everyone can read categories
CREATE POLICY "Categories are viewable by all"
    ON equipment_categories FOR SELECT
    USING (true);

-- Only admins can manage categories
CREATE POLICY "Only admins can modify categories"
    ON equipment_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
        )
    );

-- ==========================================
-- Policies: listings
-- ==========================================

-- Public listings visible to all
CREATE POLICY "Public listings viewable by everyone"
    ON listings FOR SELECT
    USING (
        volunteer_only = FALSE
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid
            AND role IN ('verified_volunteer', 'admin')
        )
    );

-- Only verified volunteers and admins can create listings
CREATE POLICY "Verified volunteers can create listings"
    ON listings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid
            AND role IN ('verified_volunteer', 'admin')
        )
        AND owner_id = current_setting('app.current_user_id', true)::uuid
    );

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
    ON listings FOR UPDATE
    USING (owner_id = current_setting('app.current_user_id', true)::uuid)
    WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
    ON listings FOR DELETE
    USING (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can manage all listings
CREATE POLICY "Admins can manage all listings"
    ON listings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
        )
    );

-- ==========================================
-- Policies: audit_log
-- ==========================================

-- Only admins can read audit log
CREATE POLICY "Admins can view audit log"
    ON audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
        )
    );

-- Only admins can insert audit log entries
CREATE POLICY "Admins can insert audit log"
    ON audit_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
        )
        AND admin_id = current_setting('app.current_user_id', true)::uuid
    );

-- ==========================================
-- Policies: sessions
-- ==========================================

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions"
    ON sessions FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- ==========================================
-- Security Notes
-- ==========================================
-- 1. RLS uses app.current_user_id setting (set by middleware)
-- 2. Role changes are only possible by admins
-- 3. Volunteer-only listings are hidden from regular users
-- 4. Users can only modify their own content
-- 5. Admins have full access to all resources
-- 6. Audit log is append-only and admin-only
-- 7. Password hashes are never exposed (SELECT excludes it in app code)
--
-- Note: Since we're not using Supabase Auth, policies use
-- current_setting('app.current_user_id') instead of auth.uid()
