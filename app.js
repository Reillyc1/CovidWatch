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
var mysql = require('mysql');

// Load environment variables from .env file in development
// Security: Sensitive configuration (database credentials, session secrets)
// should be stored in environment variables, not hardcoded in source code.
// This prevents accidental exposure through version control.
require('dotenv').config();

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

// Request logging for debugging and monitoring
app.use(logger('dev'));

// Parse JSON request bodies (for API endpoints)
app.use(express.json());

// Parse URL-encoded request bodies (for form submissions)
app.use(express.urlencoded({ extended: false }));

// Parse cookies from request headers
app.use(cookieParser());

/**
 * Session Configuration
 *
 * Sessions allow us to maintain user state across multiple requests.
 * When a user logs in, their information is stored in a session.
 *
 * Security Considerations:
 * - secret: Used to sign the session cookie. Must be a strong, random value.
 *   Loaded from environment variable to prevent exposure in code.
 * - resave: false prevents unnecessary session saves, reducing database load.
 * - saveUninitialized: false prevents creating sessions for unauthenticated users,
 *   which helps with GDPR compliance and reduces storage.
 * - cookie.secure: In production (HTTPS), this should be true to prevent
 *   session hijacking over unencrypted connections.
 * - cookie.httpOnly: Prevents JavaScript access to cookies, mitigating XSS attacks.
 * - cookie.sameSite: 'lax' provides CSRF protection while allowing normal navigation.
 */
app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,  // Prevents XSS attacks from accessing session cookie
        sameSite: 'lax', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000 // Session expires after 24 hours
    }
}));

/**
 * Security Headers Middleware
 *
 * These HTTP headers provide additional security protections:
 * - X-Content-Type-Options: Prevents MIME type sniffing attacks
 * - X-Frame-Options: Prevents clickjacking by blocking iframe embedding
 * - X-XSS-Protection: Enables browser's built-in XSS filter
 */
app.use(function(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

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
    res.status(404).send('Page not found');
});

/**
 * Global Error Handler
 *
 * Catches all errors and returns appropriate responses.
 * In development, shows detailed error information.
 * In production, hides error details to prevent information leakage.
 */
app.use(function(err, req, res, next) {
    console.error(err.stack);

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).send('Something went wrong');
    } else {
        res.status(500).send('Error: ' + err.message);
    }
});

module.exports = app;
