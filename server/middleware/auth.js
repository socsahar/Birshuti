// ==========================================
// Authentication Middleware
// Validates JWT tokens and attaches user to request
// ==========================================
const jwt = require('jsonwebtoken');
const { supabase } = require('../supabase');

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-this';

/**
 * Middleware to authenticate requests using custom JWT
 * Attaches user object to req.user if authenticated
 */
async function authenticate(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'חסר אסימון אימות',
                message: 'Missing or invalid authorization header'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                error: 'אסימון אימות לא תקין',
                message: 'Invalid or expired token'
            });
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, username, email, full_name, phone, merhav, role, volunteer_declaration, approved_at, created_at, updated_at')
            .eq('id', decoded.userId)
            .single();

        if (profileError || !profile) {
            return res.status(401).json({ 
                error: 'פרופיל משתמש לא נמצא',
                message: 'User profile not found'
            });
        }

        // Attach user and profile to request
        req.user = profile;
        req.profile = profile;
        req.token = token;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            error: 'שגיאת שרת באימות',
            message: 'Authentication server error'
        });
    }
}

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work differently for authenticated users
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            req.profile = null;
            return next();
        }

        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const { data: profile } = await supabase
                .from('users')
                .select('id, username, email, full_name, phone, merhav, role, volunteer_declaration, approved_at, created_at, updated_at')
                .eq('id', decoded.userId)
                .single();

            if (profile) {
                req.user = profile;
                req.profile = profile;
                req.token = token;
            } else {
                req.user = null;
                req.profile = null;
            }
        } catch (jwtError) {
            req.user = null;
            req.profile = null;
        }

        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
        req.profile = null;
        next();
    }
}

module.exports = {
    authenticate,
    optionalAuth
};
