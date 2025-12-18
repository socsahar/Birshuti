// ==========================================
// Input Validation Middleware
// Using express-validator
// ==========================================
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'שגיאת ולידציה',
            message: 'Validation failed',
            details: errors.array()
        });
    }
    next();
}

/**
 * Validation rules for user registration
 */
const registrationValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('שם משתמש חייב להיות בין 3-20 תווים')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('שם משתמש יכול להכיל רק אותיות אנגליות, מספרים וקו תחתון'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('כתובת אימייל לא תקינה'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('סיסמה חייבת להיות לפחות 8 תווים')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('סיסמה חייבת לכלול אותיות גדולות, קטנות ומספרים'),
    body('full_name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('שם מלא חייב להיות לפחות 2 תווים'),
    body('merhav')
        .isIn(['ירדן', 'גלבוע', 'אשר', 'כרמל', 'שרון', 'ירקון', 'דן', 'איילון', 'לכיש', 'נגב', 'ירושלים'])
        .withMessage('מרחב לא תקין'),
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^05\d{8}$/)
        .withMessage('מספר טלפון לא תקין'),
    body('volunteer_declaration')
        .optional()
        .isBoolean()
        .withMessage('ערך לא תקין להצהרת מתנדב'),
    validate
];

/**
 * Validation rules for login
 */
const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('נדרש שם משתמש'),
    body('password')
        .notEmpty()
        .withMessage('נדרשת סיסמה'),
    validate
];

/**
 * Validation rules for creating a listing
 */
const listingValidation = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('כותרת חייבת להיות בין 3-100 תווים'),
    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('תיאור יכול להיות עד 1000 תווים'),
    body('category')
        .isIn(['חולצות', 'מעילים', 'פליזים', 'מכנסיים', 'נעליים', 'אחר'])
        .withMessage('קטגוריה לא תקינה'),
    body('transaction_type')
        .isIn(['מסירה', 'השאלה', 'החלפה'])
        .withMessage('סוג עסקה לא תקין'),
    body('merhav')
        .isIn(['ירדן', 'גלבוע', 'אשר', 'כרמל', 'שרון', 'ירקון', 'דן', 'איילון', 'לכיש', 'נגב', 'ירושלים'])
        .withMessage('מרחב לא תקין'),
    body('volunteer_only')
        .optional()
        .isBoolean()
        .withMessage('ערך לא תקין עבור פרסום למתנדבים בלבד'),
    validate
];

/**
 * Validation for UUID parameters
 */
const uuidValidation = [
    param('id')
        .isUUID()
        .withMessage('מזהה לא תקין'),
    validate
];

/**
 * Validation for userId parameter (admin routes)
 */
const userIdValidation = [
    param('userId')
        .isUUID()
        .withMessage('מזהה משתמש לא תקין'),
    validate
];

module.exports = {
    validate,
    registrationValidation,
    loginValidation,
    listingValidation,
    uuidValidation,
    userIdValidation
};
