// ==========================================
// Listings Routes
// CRUD operations for equipment listings
// ==========================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase, supabaseAdmin } = require('../supabase');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireVerifiedVolunteer } = require('../middleware/rbac');
const { listingValidation, uuidValidation } = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/images/uploaded');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'listing-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

/**
 * GET /api/listings
 * Get all listings (filtered by permissions)
 * Public listings visible to all, volunteer-only to authenticated verified volunteers
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, merhav, transaction_type, search } = req.query;
        const userRole = req.profile ? req.profile.role : 'user';
        
        // Use admin client to bypass RLS (we handle filtering by role below)
        let query = supabaseAdmin
            .from('listings')
            .select(`
                *,
                owner:profiles!owner_id(id, full_name, phone, merhav)
            `)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        // Filter based on role - non-verified users can't see volunteer-only listings
        if (!['verified_volunteer', 'admin'].includes(userRole)) {
            query = query.eq('volunteer_only', false);
        }

        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }
        if (merhav) {
            query = query.eq('merhav', merhav);
        }
        if (transaction_type) {
            query = query.eq('transaction_type', transaction_type);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch listings error:', error);
            return res.status(500).json({ 
                error: 'שגיאה בטעינת פרסומים',
                message: error.message
            });
        }

        res.json({ listings: data });

    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching listings'
        });
    }
});

/**
 * GET /api/listings/:id
 * Get a single listing by ID
 */
router.get('/:id', optionalAuth, uuidValidation, async (req, res) => {
    try {
        const { id } = req.params;

        // Use admin client to bypass RLS (we check volunteer_only below)
        const { data, error } = await supabaseAdmin
            .from('listings')
            .select(`
                *,
                owner:profiles!owner_id(id, full_name, phone, merhav)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ 
                error: 'הפרסום לא נמצא',
                message: 'Listing not found'
            });
        }

        // Check if user can view this listing
        const userRole = req.profile ? req.profile.role : 'user';
        if (data.volunteer_only && !['verified_volunteer', 'admin'].includes(userRole)) {
            return res.status(403).json({ 
                error: 'אין לך הרשאה לצפות בפרסום זה',
                message: 'This listing is for verified volunteers only'
            });
        }

        res.json({ listing: data });

    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching listing'
        });
    }
});

/**
 * POST /api/listings/:id/increment-view
 * Increment view count for a listing
 */
router.post('/:id/increment-view', uuidValidation, async (req, res) => {
    try {
        const { id } = req.params;

        // Try using the stored function first (best for atomic increments)
        const { error: rpcError } = await supabaseAdmin
            .rpc('increment_listing_views', { listing_id: id });

        if (rpcError) {
            // Fallback: Use raw SQL increment (still atomic)
            const { error: updateError } = await supabaseAdmin
                .from('listings')
                .update({ views: supabaseAdmin.raw('views + 1') })
                .eq('id', id);

            if (updateError) {
                console.error('Increment view error:', updateError);
                // Don't fail the request - view counting is not critical
                return res.json({ success: false, error: 'Failed to increment view' });
            }
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Increment view error:', error);
        // Don't fail the request - view counting is not critical
        res.json({ success: false, error: 'Server error' });
    }
});

/**
 * POST /api/listings
 * Create a new listing (verified volunteers only)
 */
router.post('/', authenticate, requireVerifiedVolunteer, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, description, category, transaction_type, size, merhav, volunteer_only } = req.body;

        // Get uploaded file paths
        const image1 = req.files?.image1 ? `/images/uploaded/${req.files.image1[0].filename}` : null;
        const image2 = req.files?.image2 ? `/images/uploaded/${req.files.image2[0].filename}` : null;

        const listingData = {
            owner_id: req.profile.id,
            title,
            description: description || null,
            category,
            transaction_type,
            size: size || null,
            merhav,
            image1,
            image2,
            volunteer_only: volunteer_only === 'true' || volunteer_only === true,
            is_available: true
        };

        // Use admin client to bypass RLS (permissions already checked by middleware)
        const { data, error } = await supabaseAdmin
            .from('listings')
            .insert([listingData])
            .select(`
                *,
                owner:profiles!owner_id(id, full_name, merhav)
            `)
            .single();

        if (error) {
            console.error('Create listing error:', error);
            return res.status(400).json({ 
                error: 'שגיאה ביצירת פרסום',
                message: error.message
            });
        }

        res.status(201).json({
            message: 'הפרסום נוצר בהצלחה',
            listing: data
        });

    } catch (error) {
        console.error('Create listing server error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error creating listing'
        });
    }
});

/**
 * PATCH /api/listings/:id
 * Update a listing (owner or admin only)
 */
router.patch('/:id', authenticate, uuidValidation, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the listing to check ownership
        const { data: listing, error: fetchError } = await supabaseAdmin
            .from('listings')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !listing) {
            return res.status(404).json({ 
                error: 'הפרסום לא נמצא',
                message: 'Listing not found'
            });
        }

        // Check permissions
        const isOwner = listing.owner_id === req.profile.id;
        const isAdmin = req.profile.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                error: 'אין לך הרשאה לערוך פרסום זה',
                message: 'You can only edit your own listings'
            });
        }

        // Update allowed fields
        const updates = {};
        const allowedFields = ['title', 'description', 'category', 'transaction_type', 'size', 'merhav', 'volunteer_only', 'is_available'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field] === 'true' ? true : req.body[field] === 'false' ? false : req.body[field];
            }
        });
        
        // Handle image removal
        if (req.body.removeImage1 === 'true') {
            updates.image1 = null;
        }
        if (req.body.removeImage2 === 'true') {
            updates.image2 = null;
        }
        
        // Update images if new ones are uploaded (overrides removal)
        if (req.files?.image1) {
            updates.image1 = `/images/uploaded/${req.files.image1[0].filename}`;
        }
        if (req.files?.image2) {
            updates.image2 = `/images/uploaded/${req.files.image2[0].filename}`;
        }

        // Use admin client to bypass RLS (permissions already checked above)
        const { data, error } = await supabaseAdmin
            .from('listings')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                owner:profiles!owner_id(id, full_name, merhav)
            `)
            .single();

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה בעדכון פרסום',
                message: error.message
            });
        }

        res.json({
            message: 'הפרסום עודכן בהצלחה',
            listing: data
        });

    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error updating listing'
        });
    }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing (owner or admin only)
 */
router.delete('/:id', authenticate, uuidValidation, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the listing to check ownership
        const { data: listing, error: fetchError } = await supabaseAdmin
            .from('listings')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !listing) {
            return res.status(404).json({ 
                error: 'הפרסום לא נמצא',
                message: 'Listing not found'
            });
        }

        // Check permissions
        const isOwner = listing.owner_id === req.profile.id;
        const isAdmin = req.profile.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                error: 'אין לך הרשאה למחוק פרסום זה',
                message: 'You can only delete your own listings'
            });
        }

        // Use admin client to bypass RLS (permissions already checked above)
        const { error } = await supabaseAdmin
            .from('listings')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(400).json({ 
                error: 'שגיאה במחיקת פרסום',
                message: error.message
            });
        }

        res.json({ message: 'הפרסום נמחק בהצלחה' });

    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error deleting listing'
        });
    }
});

/**
 * GET /api/listings/my/listings
 * Get current user's listings
 */
router.get('/my/listings', authenticate, async (req, res) => {
    try {
        // Use admin client to bypass RLS (user is authenticated, showing own listings)
        const { data, error } = await supabaseAdmin
            .from('listings')
            .select('*')
            .eq('owner_id', req.profile.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch my listings error:', error);
            return res.status(500).json({ 
                error: 'שגיאה בטעינת הפרסומים שלך',
                message: error.message
            });
        }

        res.json({ listings: data });

    } catch (error) {
        console.error('Get my listings error:', error);
        res.status(500).json({ 
            error: 'שגיאת שרת',
            message: 'Server error fetching your listings'
        });
    }
});

module.exports = router;
