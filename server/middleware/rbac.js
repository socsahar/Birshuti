// ==========================================
// Role-Based Access Control (RBAC) Middleware
// Checks user roles and permissions
// ==========================================

/**
 * Require user to have one of the specified roles
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.profile) {
            return res.status(401).json({ 
                error: 'נדרש אימות',
                message: 'Authentication required'
            });
        }

        const userRole = req.profile.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: 'אין לך הרשאה לבצע פעולה זו',
                message: 'Insufficient permissions'
            });
        }

        next();
    };
}

/**
 * Require verified volunteer status
 * Shorthand for requireRole(['verified_volunteer', 'admin'])
 */
function requireVerifiedVolunteer(req, res, next) {
    return requireRole(['verified_volunteer', 'admin'])(req, res, next);
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
    return requireRole(['admin'])(req, res, next);
}

/**
 * Check if user can modify a resource they own
 * Used for listings, etc.
 */
function requireOwnershipOrAdmin(ownerIdField = 'owner_id') {
    return (req, res, next) => {
        if (!req.profile) {
            return res.status(401).json({ 
                error: 'נדרש אימות',
                message: 'Authentication required'
            });
        }

        const isAdmin = req.profile.role === 'admin';
        const isOwner = req.resource && req.resource[ownerIdField] === req.profile.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ 
                error: 'אין לך הרשאה לערוך משאב זה',
                message: 'You can only modify your own resources'
            });
        }

        next();
    };
}

module.exports = {
    requireRole,
    requireVerifiedVolunteer,
    requireAdmin,
    requireOwnershipOrAdmin
};
