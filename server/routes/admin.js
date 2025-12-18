// ==========================================
// Admin Routes
// User management, role assignments, approvals
// ==========================================
const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { uuidValidation, userIdValidation } = require('../middleware/validation');

/**
 * Helper function to log admin actions
 */
async function logAdminAction(adminId, action, targetUserId, details = null) {
    try {
        // Use admin client to bypass RLS
        await supabaseAdmin
            .from('audit_log')
            .insert([{
                admin_id: adminId,
                action,
                target_user_id: targetUserId,
                details
            }]);
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
    try {
        // Get user counts by role
        const { data: users, error: usersError } = await supabaseAdmin
            .from('profiles')
            .select('role');

        if (usersError) {
            return res.status(500).json({ 
                error: 'שגיאה בטעינת סטטיסטיקות',
                message: usersError.message
            });
        }

        const stats = {
            total_users: users.length,
            pending_volunteers: users.filter(u => u.role === 'pending_volunteer').length,
            verified_volunteers: users.filter(u => u.role === 'verified_volunteer').length,
            admins: users.filter(u => u.role === 'admin').length,
            regular_users: users.filter(u => u.role === 'user').length
        };

        // Get listings count
        const { count: listingsCount, error: listingsError } = await supabaseAdmin
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('is_available', true);

        if (!listingsError) {
            stats.active_listings = listingsCount;
        }

        res.json({ stats });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching statistics'
        });
    }
});

/**
 * GET /api/admin/pending-volunteers
 * Get all users waiting for volunteer approval
 */
router.get('/pending-volunteers', authenticate, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'pending_volunteer')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ 
                error: 'שגיאה בטעינת רשימת ממתינים',
                message: error.message
            });
        }

        res.json({ pending: data });

    } catch (error) {
        console.error('Get pending volunteers error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching pending volunteers'
        });
    }
});

/**
 * GET /api/admin/users
 * Get all users with optional filters
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const { role, search } = req.query;
        
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ 
                error: 'שגיאה בטעינת משתמשים',
                message: error.message
            });
        }

        res.json({ users: data });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching users'
        });
    }
});

/**
 * POST /api/admin/approve-volunteer/:userId
 * Approve a pending volunteer
 */
router.post('/approve-volunteer/:userId', authenticate, requireAdmin, userIdValidation, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists and is pending
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ 
                error: 'משתמש לא נמצא',
                message: 'User not found'
            });
        }

        if (user.role !== 'pending_volunteer') {
            return res.status(400).json({ 
                error: 'משתמש אינו ממתין לאישור',
                message: 'User is not pending approval'
            });
        }

        // Update role to verified_volunteer
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'verified_volunteer',
                approved_at: new Date().toISOString(),
                approved_by: req.profile.id
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה באישור מתנדב',
                message: error.message
            });
        }

        // Log the action
        await logAdminAction(req.profile.id, 'approve_volunteer', userId, {
            old_role: 'pending_volunteer',
            new_role: 'verified_volunteer'
        });

        res.json({
            message: 'המתנדב אושר בהצלחה',
            user: data
        });

    } catch (error) {
        console.error('Approve volunteer error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error approving volunteer'
        });
    }
});

/**
 * POST /api/admin/reject-volunteer/:userId
 * Reject a pending volunteer (revert to regular user)
 */
router.post('/reject-volunteer/:userId', authenticate, requireAdmin, userIdValidation, async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ 
                error: 'משתמש לא נמצא',
                message: 'User not found'
            });
        }

        if (user.role !== 'pending_volunteer') {
            return res.status(400).json({ 
                error: 'משתמש אינו ממתין לאישור',
                message: 'User is not pending approval'
            });
        }

        // Update role to regular user
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'user',
                volunteer_declaration: false
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה בדחיית בקשה',
                message: error.message
            });
        }

        // Log the action
        await logAdminAction(req.profile.id, 'reject_volunteer', userId, {
            old_role: 'pending_volunteer',
            new_role: 'user'
        });

        res.json({
            message: 'הבקשה נדחתה',
            user: data
        });

    } catch (error) {
        console.error('Reject volunteer error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error rejecting volunteer'
        });
    }
});

/**
 * POST /api/admin/promote-admin/:userId
 * Promote a user to admin
 */
router.post('/promote-admin/:userId', authenticate, requireAdmin, userIdValidation, async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ 
                error: 'משתמש לא נמצא',
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ 
                error: 'משתמש כבר מנהל',
                message: 'User is already an admin'
            });
        }

        // Update role to admin
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה בקידום למנהל',
                message: error.message
            });
        }

        // Log the action
        await logAdminAction(req.profile.id, 'promote_admin', userId, {
            old_role: user.role,
            new_role: 'admin'
        });

        res.json({
            message: 'המשתמש קודם למנהל',
            user: data
        });

    } catch (error) {
        console.error('Promote admin error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error promoting to admin'
        });
    }
});

/**
 * POST /api/admin/demote-admin/:userId
 * Demote an admin to verified volunteer
 */
router.post('/demote-admin/:userId', authenticate, requireAdmin, userIdValidation, async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent self-demotion
        if (userId === req.profile.id) {
            return res.status(400).json({ 
                error: 'לא ניתן להוריד את ההרשאות של עצמך',
                message: 'Cannot demote yourself'
            });
        }

        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Protect the main admin account
        if (user && user.username === 'admin') {
            return res.status(403).json({ 
                error: 'לא ניתן להוריד את הרשאות המנהל הראשי',
                message: 'Cannot demote the main admin account'
            });
        }

        if (fetchError || !user) {
            return res.status(404).json({ 
                error: 'משתמש לא נמצא',
                message: 'User not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ 
                error: 'משתמש אינו מנהל',
                message: 'User is not an admin'
            });
        }

        // Update role to verified_volunteer
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'verified_volunteer' })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה בהורדת הרשאות',
                message: error.message
            });
        }

        // Log the action
        await logAdminAction(req.profile.id, 'demote_admin', userId, {
            old_role: 'admin',
            new_role: 'verified_volunteer'
        });

        res.json({
            message: 'הרשאות המנהל הוסרו',
            user: data
        });

    } catch (error) {
        console.error('Demote admin error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error demoting admin'
        });
    }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user and all their data
 */
router.delete('/users/:userId', authenticate, requireAdmin, userIdValidation, async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.profile.id;

        // Prevent admin from deleting themselves
        if (userId === adminId) {
            return res.status(400).json({ 
                error: 'לא ניתן למחוק את המשתמש שלך'
            });
        }

        // Check if user exists
        const { data: userToDelete, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('full_name, username')
            .eq('id', userId)
            .single();

        if (fetchError || !userToDelete) {
            return res.status(404).json({ 
                error: 'משתמש לא נמצא'
            });
        }

        // Protect the main admin account
        if (userToDelete.username === 'admin') {
            return res.status(403).json({ 
                error: 'לא ניתן למחוק את המנהל הראשי',
                message: 'Cannot delete the main admin account'
            });
        }

        // Delete user's listings first (using correct column name: owner_id)
        const { error: listingsDeleteError } = await supabaseAdmin
            .from('listings')
            .delete()
            .eq('owner_id', userId);

        if (listingsDeleteError) {
            console.error('Error deleting user listings:', listingsDeleteError);
        }

        // Update audit log entries to set target_user_id to NULL (preserve history but remove FK constraint)
        await supabaseAdmin
            .from('audit_log')
            .update({ target_user_id: null })
            .eq('target_user_id', userId);

        // Also update admin_id in audit log if this user was an admin who performed actions
        await supabaseAdmin
            .from('audit_log')
            .update({ admin_id: null })
            .eq('admin_id', userId);

        // Delete the user from users table
        const { error: deleteError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) {
            console.error('Error deleting user from users table:', deleteError);
            return res.status(500).json({ 
                error: 'שגיאה במחיקת משתמש',
                message: deleteError.message,
                details: deleteError
            });
        }

        // Log the action
        await logAdminAction(adminId, 'delete_user', userId, {
            deleted_user_name: userToDelete.full_name
        });

        res.json({
            message: 'המשתמש נמחק בהצלחה',
            deleted_user: userToDelete.full_name
        });

    } catch (error) {
        console.error('Delete user error - full details:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error deleting user',
            details: error.message
        });
    }
});

/**
 * GET /api/admin/audit-log
 * Get audit log of admin actions
 */
router.get('/audit-log', authenticate, requireAdmin, async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        // Use admin client to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('audit_log')
            .select(`
                *,
                admin:profiles!admin_id(full_name, email),
                target_user:profiles!target_user_id(full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            return res.status(500).json({ 
                error: 'שגיאה בטעינת יומן פעולות',
                message: error.message
            });
        }

        res.json({ log: data });

    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching audit log'
        });
    }
});

module.exports = router;
