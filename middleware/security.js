/**
 * CovidWatch - Security Middleware
 *
 * This module provides security middleware for rate limiting and request validation.
 * Rate limiting protects against brute-force attacks and denial-of-service attempts.
 */

var rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Configuration
 *
 * Different rate limits are applied to different types of endpoints:
 * - Auth endpoints (login/signup): Stricter limits to prevent brute-force
 * - General API: Moderate limits for normal usage
 * - Static assets: More lenient limits
 */

// Store for tracking rate limit data
// In production, consider using a Redis store for distributed deployments
var rateLimitStore = new Map();

/**
 * Custom key generator that combines IP and user ID (if authenticated)
 * This prevents authenticated users from bypassing IP-based limits
 */
function getClientKey(req) {
    var ip = req.ip || req.connection.remoteAddress || 'unknown';
    var userId = req.session && req.session.user ? req.session.user.u_id : 'anonymous';
    return ip + ':' + userId;
}

/**
 * Standard error handler for rate limit exceeded
 * Returns a graceful 429 response with retry information
 */
function rateLimitHandler(req, res, next, options) {
    res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
    });
}

/**
 * Rate limiter for authentication endpoints (login, signup)
 * Strict limits: 5 requests per 15 minutes per IP
 * This prevents brute-force password attacks
 */
var authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts',
        message: 'Please wait 15 minutes before trying again.',
        retryAfter: 900
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    keyGenerator: function(req) {
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: function(req, res, next, options) {
        res.status(429).json({
            error: 'Too many authentication attempts',
            message: 'For security, please wait 15 minutes before trying again.',
            retryAfter: 900
        });
    },
    skip: function(req, res) {
        // Skip rate limiting in test environment
        return process.env.NODE_ENV === 'test';
    }
});

/**
 * Rate limiter for general API endpoints
 * Moderate limits: 100 requests per 15 minutes per IP+user
 */
var apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        error: 'Too many requests',
        message: 'Please slow down and try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientKey,
    handler: rateLimitHandler,
    skip: function(req, res) {
        return process.env.NODE_ENV === 'test';
    }
});

/**
 * Rate limiter for data modification endpoints (POST, PUT, DELETE)
 * Stricter limits: 30 requests per 15 minutes
 * Prevents spam and abuse of write operations
 */
var writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 write operations per window
    message: {
        error: 'Too many write operations',
        message: 'Please slow down and try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientKey,
    handler: rateLimitHandler,
    skip: function(req, res) {
        return process.env.NODE_ENV === 'test';
    }
});

/**
 * Rate limiter for password reset and sensitive operations
 * Very strict: 3 requests per hour
 */
var sensitiveOpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        error: 'Too many requests for this operation',
        message: 'Please wait an hour before trying again.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: function(req) {
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: function(req, res, next, options) {
        res.status(429).json({
            error: 'Too many requests for this operation',
            message: 'For security, please wait an hour before trying again.',
            retryAfter: 3600
        });
    },
    skip: function(req, res) {
        return process.env.NODE_ENV === 'test';
    }
});

/**
 * Middleware to reject requests with unexpected fields
 * Helps prevent parameter pollution and injection attacks
 */
function rejectUnexpectedFields(allowedFields) {
    return function(req, res, next) {
        if (req.body && typeof req.body === 'object') {
            var bodyFields = Object.keys(req.body);
            var unexpectedFields = bodyFields.filter(function(field) {
                return !allowedFields.includes(field);
            });

            if (unexpectedFields.length > 0) {
                return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Unexpected fields in request: ' + unexpectedFields.join(', ')
                });
            }
        }
        next();
    };
}

/**
 * Middleware to sanitize string inputs
 * Trims whitespace and removes null bytes
 */
function sanitizeInputs(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(function(key) {
            if (typeof req.body[key] === 'string') {
                // Trim whitespace and remove null bytes
                req.body[key] = req.body[key].trim().replace(/\0/g, '');
            }
        });
    }
    next();
}

module.exports = {
    authLimiter: authLimiter,
    apiLimiter: apiLimiter,
    writeLimiter: writeLimiter,
    sensitiveOpLimiter: sensitiveOpLimiter,
    rejectUnexpectedFields: rejectUnexpectedFields,
    sanitizeInputs: sanitizeInputs
};
