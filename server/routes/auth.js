// ==========================================
// Authentication Routes
// Handle user registration, login, logout
// ==========================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../supabase');
const { registrationValidation, loginValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registrationValidation, async (req, res) => {
    try {
        const { username, email, password, full_name, phone, merhav, volunteer_declaration } = req.body;

        // Validate required fields
        if (!phone || phone.trim() === '') {
            return res.status(400).json({ error: 'מספר טלפון הוא שדה חובה' });
        }

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ 
                error: 'שם המשתמש כבר תפוס',
                message: 'Username already taken'
            });
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingEmail) {
            return res.status(400).json({ 
                error: 'האימייל כבר בשימוש',
                message: 'Email already in use'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Determine role based on volunteer declaration
        const role = volunteer_declaration ? 'pending_volunteer' : 'user';

        // Insert user into database (use admin to bypass RLS for registration)
        const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                email,
                password_hash,
                full_name,
                phone: phone,
                merhav,
                role,
                volunteer_declaration: volunteer_declaration || false
            })
            .select()
            .single();

        if (error) {
            console.error('Registration error:', error);
            return res.status(400).json({ 
                error: 'שגיאה ביצירת חשבון',
                message: error.message
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Remove password_hash from response
        delete newUser.password_hash;

        res.status(201).json({
            message: 'החשבון נוצר בהצלחה',
            user: newUser,
            session: {
                access_token: token,
                expires_in: 604800 // 7 days in seconds
            },
            profile: newUser
        });

    } catch (error) {
        console.error('Registration server error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error during registration'
        });
    }
});

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', loginValidation, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Look up user by username
        const { data: user, error: lookupError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (lookupError || !user) {
            return res.status(401).json({ 
                error: 'שם משתמש או סיסמה שגויים',
                message: 'Invalid username or password'
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ 
                error: 'שם משתמש או סיסמה שגויים',
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Remove password_hash from response
        delete user.password_hash;

        res.json({
            message: 'התחברת בהצלחה',
            user: user,
            profile: user,
            session: {
                access_token: token,
                expires_in: 604800 // 7 days in seconds
            }
        });

    } catch (error) {
        console.error('Login server error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error during login'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(500).json({ 
                error: 'שגיאה בהתנתקות',
                message: error.message
            });
        }

        res.json({ message: 'התנתקת בהצלחה' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error during logout'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            user: req.user,
            profile: req.profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching profile'
        });
    }
});

/**
 * PATCH /api/auth/profile
 * Update user's own profile (not role)
 */
router.patch('/profile', authenticate, async (req, res) => {
    try {
        const { full_name, phone, merhav } = req.body;
        const updates = {};

        if (full_name) updates.full_name = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (merhav) updates.merhav = merhav;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', req.profile.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה בעדכון פרופיל',
                message: error.message
            });
        }

        res.json({
            message: 'הפרופיל עודכן בהצלחה',
            profile: data
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error updating profile'
        });
    }
});

module.exports = router;
