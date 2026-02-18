/**
 * CovidWatch - Main Application Configuration
 *
 * This is the central configuration file for the Express.js application.
 * It sets up middleware, database connections, session management, and routing.
 */

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var mysql = require('mysql2');
var helmet = require('helmet');

// Load environment variables from .env file in development
// Security: Sensitive configuration (database credentials, session secrets)
// should be stored in environment variables, not hardcoded in source code.
require('dotenv').config();

// Import security middleware
var security = require('./middleware/security');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

/**
 * Database Connection Pool
 *
 * Using a connection pool instead of single connections for better performance.
 * The pool manages multiple connections and reuses them efficiently.
 *
 * Security Note: Database credentials are loaded from environment variables.
 * Never commit actual credentials to version control.
 */
var dbConnectionPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'covidwatch',
    // Connection pool settings for stability
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

// Make database pool available to all routes via req.pool
app.use(function(req, res, next) {
    req.pool = dbConnectionPool;
    next();
});

// Trust proxy if behind a reverse proxy (for accurate IP addresses in rate limiting)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Request logging for debugging and monitoring
app.use(logger('dev'));

// Parse JSON request bodies (for API endpoints)
// Limit body size to prevent denial-of-service attacks
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded request bodies (for form submissions)
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Parse cookies from request headers
app.use(cookieParser());

/**
 * Security Headers with Helmet
 *
 * Helmet sets various HTTP headers to protect against common vulnerabilities:
 * - Content Security Policy (CSP): Prevents XSS and data injection attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Enables browser XSS filtering
 * - Strict-Transport-Security: Enforces HTTPS
 * - Referrer-Policy: Controls referrer information
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://api.mapbox.com",
                "'unsafe-inline'" // Required for inline map initialization
            ],
            styleSrc: [
                "'self'",
                "https://api.mapbox.com",
                "https://cdnjs.cloudflare.com",
                "'unsafe-inline'" // Required for Mapbox styles
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://api.mapbox.com",
                "https://*.tiles.mapbox.com"
            ],
            connectSrc: [
                "'self'",
                "https://api.mapbox.com",
                "https://*.tiles.mapbox.com",
                "https://events.mapbox.com"
            ],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com"
            ],
            workerSrc: [
                "'self'",
                "blob:"
            ],
            childSrc: ["blob:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false, // Disable for Mapbox compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

/**
 * Session Configuration
 *
 * Sessions allow us to maintain user state across multiple requests.
 * When a user logs in, their information is stored in a session.
 *
 * Security Considerations:
 * - secret: Used to sign the session cookie. Must be a strong, random value.
 * - resave: false prevents unnecessary session saves
 * - saveUninitialized: false prevents creating sessions for unauthenticated users
 * - cookie.secure: In production, this must be true to prevent session hijacking
 * - cookie.httpOnly: Prevents JavaScript access to cookies, mitigating XSS attacks
 * - cookie.sameSite: 'strict' provides strong CSRF protection
 */

// Validate session secret is configured
var sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: SESSION_SECRET must be set in production. Exiting.');
        process.exit(1);
    }
    console.warn('WARNING: SESSION_SECRET is not set. Using insecure default for development only.');
    sessionSecret = 'dev-only-insecure-secret-do-not-use-in-production';
}

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Change from default 'connect.sid' to prevent fingerprinting
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Apply input sanitization globally
app.use(security.sanitizeInputs);

// Apply general API rate limiting to all routes
app.use(security.apiLimiter);

// Serve static files (HTML, CSS, JS, images) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount route handlers
app.use('/', indexRouter);
app.use('/users', usersRouter);

/**
 * 404 Error Handler
 * Catches requests to undefined routes and returns a user-friendly error.
 */
app.use(function(req, res, next) {
    res.status(404).json({ error: 'Not found' });
});

/**
 * Global Error Handler
 *
 * Catches all errors and returns appropriate responses.
 * In production, hides error details to prevent information leakage.
 */
app.use(function(err, req, res, next) {
    // Log error for debugging (but not sensitive details to console in production)
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    } else {
        console.error('Error:', err.message);
    }

    // Never leak error details in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal server error' });
    } else {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
