/**
 * CovidWatch - Main Routes
 *
 * This file handles the primary application routes including:
 * - Home page
 * - User session status
 * - Account redirection based on user type
 * - Map marker operations
 */

var express = require('express');
var router = express.Router();

/**
 * Authentication Middleware
 *
 * This middleware checks if a user is logged in before allowing access
 * to protected routes. It prevents unauthorized users from accessing
 * sensitive data or functionality.
 *
 * Security Note: Always verify authentication server-side, never rely
 * solely on client-side checks which can be bypassed.
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next(); // User is authenticated, proceed to route
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

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
 *
 * Security Note: We verify the session exists before accessing user data
 * to prevent crashes from undefined access.
 */
router.get('/account', function(req, res, next) {
    // Check if user is logged in first
    if (!req.session || !req.session.user) {
        return res.redirect('/login.html');
    }

    // Redirect based on user type
    var userType = req.session.user.user_type;

    if (userType === 'user') {
        res.redirect('/user.html');
    } else if (userType === 'manager') {
        res.redirect('/manager.html');
    } else if (userType === 'admin') {
        res.redirect('/admin.html');
    } else {
        // Unknown user type, redirect to home
        res.redirect('/');
    }
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
 *
 * Note: This queries a 'mapmarkers' table that stores longitude/latitude
 * coordinates for COVID hotspots to display on the interactive map.
 */
router.get('/mapmarkers', requireAuth, function(req, res, next) {
    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        // Using parameterized query (no user input here, but good practice)
        var query = 'SELECT * FROM mapmarkers;';

        connection.query(query, function(err, rows, fields) {
            connection.release(); // Always release connection back to pool

            if (err) {
                console.error('Query error:', err);
                return res.status(500).json({ error: 'Failed to retrieve markers' });
            }

            res.json(rows); // Fixed: was incorrectly using 'row' instead of 'rows'
        });
    });
});

/**
 * POST /addmarkers
 * Add a new COVID hotspot marker to the map
 *
 * Protected route - requires authentication
 *
 * Request body should contain:
 * - long: Longitude coordinate (number)
 * - lat: Latitude coordinate (number)
 *
 * Security Note: Input validation ensures coordinates are valid numbers
 * and within acceptable ranges to prevent invalid data.
 */
router.post('/addmarkers', requireAuth, function(req, res, next) {
    // Input validation
    var longitude = parseFloat(req.body.long);
    var latitude = parseFloat(req.body.lat);

    // Validate coordinates are numbers and within valid ranges
    if (isNaN(longitude) || isNaN(latitude)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Longitude must be between -180 and 180
    if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    // Latitude must be between -90 and 90
    if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }

    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        // Parameterized query prevents SQL injection
        var query = 'INSERT INTO mapmarkers (longitude, latitude) VALUES (?, ?);';

        connection.query(query, [longitude, latitude], function(err, result, fields) {
            connection.release();

            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ error: 'Failed to add marker' });
            }

            // Return success with the new marker's ID
            res.status(201).json({
                success: true,
                id: result.insertId,
                longitude: longitude,
                latitude: latitude
            });
        });
    });
});

module.exports = router;
