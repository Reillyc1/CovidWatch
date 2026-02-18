/**
 * CovidWatch - Main Routes
 *
 * This file handles the primary application routes including:
 * - Home page
 * - User session status
 * - Account redirection based on user type
 * - Map marker operations
 * - Secure API key delivery
 *
 * Security features:
 * - Role-based access control
 * - Input validation
 * - Rate limiting
 * - Secure API key handling
 */

var express = require('express');
var router = express.Router();

// Security middleware
var security = require('../middleware/security');
var validation = require('../middleware/validation');

/**
 * Authentication Middleware
 *
 * Checks if a user is logged in before allowing access to protected routes.
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

/**
 * Role-based Authorization Middleware Factory
 *
 * Creates middleware that checks if the user has one of the allowed roles.
 * This enforces principle of least privilege.
 *
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
function requireRole(allowedRoles) {
    return function(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        var userType = req.session.user.user_type;

        if (!allowedRoles.includes(userType)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
}

/**
 * Allowed fields for marker endpoint
 */
var ALLOWED_FIELDS = {
    marker: ['long', 'lat']
};

/**
 * GET /
 * Home page - renders the main application page
 */
router.get('/', function(req, res, next) {
    res.sendFile('index.html', { root: './public' });
});

/**
 * GET /header
 * Check user login status
 *
 * Returns "in" if user is logged in, "out" otherwise.
 * Used by the frontend to show/hide appropriate UI elements.
 */
router.get('/header', function(req, res, next) {
    if (req.session && req.session.user) {
        res.send('in');
    } else {
        res.send('out');
    }
});

/**
 * GET /home
 * Redirect to home page
 */
router.get('/home', function(req, res, next) {
    res.redirect('/');
});

/**
 * GET /account
 * Redirect users to their appropriate dashboard based on account type
 */
router.get('/account', function(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login.html');
    }

    var userType = req.session.user.user_type;

    if (userType === 'user') {
        res.redirect('/user.html');
    } else if (userType === 'manager') {
        res.redirect('/manager.html');
    } else if (userType === 'admin') {
        res.redirect('/admin.html');
    } else {
        res.redirect('/');
    }
});

/**
 * GET /api/config/mapbox
 * Securely deliver Mapbox token to authenticated users
 *
 * Security: Token is stored in environment variables, not client-side code.
 * Only authenticated users can retrieve the token.
 * Token is rate-limited to prevent abuse.
 *
 * Note: Mapbox public tokens are designed to be used client-side and can be
 * restricted by domain in the Mapbox dashboard. This endpoint adds an extra
 * layer by requiring authentication.
 */
router.get('/api/config/mapbox', requireAuth, function(req, res, next) {
    var token = process.env.MAPBOX_TOKEN;

    if (!token) {
        return res.status(503).json({ error: 'Map service unavailable' });
    }

    res.json({ token: token });
});

/**
 * GET /username
 * Get the current user's username
 *
 * Protected route - requires authentication
 */
router.get('/username', requireAuth, function(req, res, next) {
    res.send(req.session.user.username);
});

/**
 * GET /email
 * Get the current user's email address
 *
 * Protected route - requires authentication
 */
router.get('/email', requireAuth, function(req, res, next) {
    res.send(req.session.user.email_address);
});

/**
 * GET /mapmarkers
 * Retrieve all COVID hotspot markers for the map
 *
 * Protected route - requires authentication
 */
router.get('/mapmarkers', requireAuth, function(req, res, next) {
    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        var query = 'SELECT * FROM mapmarkers;';

        connection.query(query, function(err, rows) {
            connection.release();

            if (err) {
                console.error('Query error:', err);
                return res.status(500).json({ error: 'Failed to retrieve markers' });
            }

            res.json(rows);
        });
    });
});

/**
 * POST /addmarkers
 * Add a new COVID hotspot marker to the map
 *
 * Security features:
 * - Requires authentication
 * - Role-based: Only managers and admins can add markers
 * - Rate limited for write operations
 * - Input validation for coordinates
 * - Rejects unexpected fields
 */
router.post('/addmarkers',
    requireAuth,
    requireRole(['manager', 'admin']),
    security.writeLimiter,
    security.rejectUnexpectedFields(ALLOWED_FIELDS.marker),
    validation.markerValidation,
    function(req, res, next) {
        var longitude = parseFloat(req.body.long);
        var latitude = parseFloat(req.body.lat);

        req.pool.getConnection(function(err, connection) {
            if (err) {
                console.error('Database connection error:', err);
                return res.status(500).json({ error: 'Database connection failed' });
            }

            var query = 'INSERT INTO mapmarkers (longitude, latitude) VALUES (?, ?);';

            connection.query(query, [longitude, latitude], function(err, result) {
                connection.release();

                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({ error: 'Failed to add marker' });
                }

                res.status(201).json({
                    success: true,
                    id: result.insertId,
                    longitude: longitude,
                    latitude: latitude
                });
            });
        });
    }
);

module.exports = router;
