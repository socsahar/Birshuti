// ==========================================
// Express Server - Main Entry Point
// ==========================================
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Security Middleware
// ==========================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.SUPABASE_URL]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.BASE_URL 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: { error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' }
});

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // 100 requests per minute
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', generalLimiter);

// ==========================================
// Body Parsing
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Static Files
// ==========================================
app.use(express.static(path.join(__dirname, '../public')));
app.use('/views', express.static(path.join(__dirname, '../views')));

// ==========================================
// API Routes
// ==========================================
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// Health Check
// ==========================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ==========================================
// Serve HTML Pages
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/home.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/listings', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/listings.html'));
});

app.get('/create-listing', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/create-listing.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'));
});

app.get('/listing/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/listing-detail.html'));
});

app.get('/listing-detail', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/listing-detail.html'));
});

// ==========================================
// Error Handling
// ==========================================
app.use((req, res) => {
    res.status(404).json({ 
        error: 'הדף לא נמצא',
        message: 'Page not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'שגיאת שרת',
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Access at: http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
