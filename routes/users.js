/**
 * CovidWatch - User Routes
 *
 * This file handles user-related operations including:
 * - Authentication (login/logout)
 * - User registration (signup)
 * - Venue check-ins
 * - Check-in history retrieval
 */

var express = require('express');
var router = express.Router();

/**
 * Authentication Middleware
 *
 * Checks if a user is logged in before allowing access to protected routes.
 * Returns 401 Unauthorized if no valid session exists.
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

/**
 * Input Validation Helpers
 *
 * These functions validate user input to prevent:
 * - SQL injection (handled by parameterized queries)
 * - XSS attacks (by rejecting dangerous characters)
 * - Invalid data from being stored in the database
 */

// Validate username: alphanumeric and underscore only, 3-30 characters
function isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

// Validate email format
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    // Basic email validation - checks for @ and domain
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// Validate name: letters, spaces, hyphens, apostrophes, 1-50 characters
function isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    return /^[a-zA-Z\s\-']{1,50}$/.test(name);
}

// Validate password: minimum 6 characters
function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 6 && password.length <= 100;
}

// Validate check-in code: alphanumeric, 4-10 characters
function isValidCheckInCode(code) {
    if (!code || typeof code !== 'string') return false;
    return /^[a-zA-Z0-9]{4,10}$/.test(code);
}

// Validate user type
function isValidUserType(type) {
    return ['user', 'manager'].includes(type);
}

/**
 * GET /users
 * Basic route for testing - returns a simple message
 */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

/**
 * POST /users/login
 * Authenticate a user with username and password
 *
 * Request body:
 * - user: Username
 * - pass: Password (will be hashed with SHA2-256 for comparison)
 *
 * Security Notes:
 * - Passwords are stored as SHA2-256 hashes, never in plain text
 * - Generic error message prevents username enumeration attacks
 * - Parameterized queries prevent SQL injection
 */
router.post('/login', function(req, res, next) {
    // Validate required fields exist
    if (!('user' in req.body) || !('pass' in req.body)) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    var username = req.body.user;
    var password = req.body.pass;

    // Validate input formats
    if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Invalid username format' });
    }

    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        // Parameterized query prevents SQL injection
        // SHA2(?, 256) hashes the password for secure comparison
        var query = `SELECT u_id, given_name, family_name, username, email_address, user_type
                     FROM user WHERE username = ? AND password = SHA2(?, 256);`;

        connection.query(query, [username, password], function(err, rows, fields) {
            connection.release();

            if (err) {
                console.error('Query error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (rows.length > 0) {
                // Store user info in session (excluding password)
                req.session.user = rows[0];
                res.json({
                    success: true,
                    username: rows[0].username,
                    user_type: rows[0].user_type
                });
            } else {
                // Generic error prevents username enumeration
                res.status(401).json({ error: 'Invalid username or password' });
            }
        });
    });
});

/**
 * POST /users/logout
 * End the user's session
 *
 * Security Note: We destroy the entire session rather than just
 * deleting user data to ensure complete cleanup.
 */
router.post('/logout', function(req, res, next) {
    if (req.session) {
        req.session.destroy(function(err) {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ success: true });
        });
    } else {
        res.json({ success: true });
    }
});

/**
 * POST /users/signup
 * Register a new user account
 *
 * Request body:
 * - user: Username (alphanumeric + underscore, 3-30 chars)
 * - pass: Password (minimum 6 characters)
 * - email: Email address
 * - given_name: First name
 * - family_name: Last name
 * - type: User type ('user' or 'manager')
 *
 * Security Notes:
 * - All inputs are validated before database insertion
 * - Password is hashed with SHA2-256 before storage
 * - Parameterized queries prevent SQL injection
 */
router.post('/signup', function(req, res, next) {
    // Validate all required fields exist
    var requiredFields = ['user', 'pass', 'email', 'given_name', 'family_name', 'type'];
    for (var field of requiredFields) {
        if (!(field in req.body)) {
            return res.status(400).json({ error: 'Missing required field: ' + field });
        }
    }

    var username = req.body.user;
    var password = req.body.pass;
    var email = req.body.email;
    var givenName = req.body.given_name;
    var familyName = req.body.family_name;
    var userType = req.body.type;

    // Validate all inputs
    if (!isValidUsername(username)) {
        return res.status(400).json({
            error: 'Username must be 3-30 characters, alphanumeric and underscores only'
        });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            error: 'Password must be at least 6 characters'
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!isValidName(givenName)) {
        return res.status(400).json({ error: 'Invalid first name' });
    }

    if (!isValidName(familyName)) {
        return res.status(400).json({ error: 'Invalid last name' });
    }

    if (!isValidUserType(userType)) {
        return res.status(400).json({ error: 'Invalid user type' });
    }

    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        // First check if username already exists
        var checkQuery = 'SELECT username FROM user WHERE username = ?;';

        connection.query(checkQuery, [username], function(err, rows) {
            if (err) {
                connection.release();
                console.error('Query error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (rows.length > 0) {
                connection.release();
                return res.status(409).json({ error: 'Username already exists' });
            }

            // Insert new user with hashed password
            var insertQuery = `INSERT INTO user (given_name, family_name, username, password, email_address, user_type)
                              VALUES (?, ?, ?, SHA2(?, 256), ?, ?);`;

            connection.query(insertQuery, [givenName, familyName, username, password, email, userType],
                function(err, result) {
                    connection.release();

                    if (err) {
                        console.error('Insert error:', err);
                        // Check for duplicate email
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ error: 'Username or email already exists' });
                        }
                        return res.status(500).json({ error: 'Registration failed' });
                    }

                    // Registration successful
                    res.status(201).json({
                        success: true,
                        message: 'Account created successfully'
                    });
                });
        });
    });
});

/**
 * POST /users/check_in
 * Record a venue check-in for COVID contact tracing
 *
 * Protected route - requires authentication
 *
 * Request body:
 * - check_in: The venue's check-in code
 * - date: Date of check-in (YYYY-MM-DD format)
 * - time: Time of check-in (HH:MM:SS format)
 *
 * Security Note: Username is taken from session, not from request body,
 * preventing users from creating check-ins for other users.
 */
router.post('/check_in', requireAuth, function(req, res, next) {
    // Validate required fields
    if (!('check_in' in req.body) || !('date' in req.body) || !('time' in req.body)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    var checkInCode = req.body.check_in;
    var date = req.body.date;
    var time = req.body.time;

    // Get username from session (secure - user can't fake this)
    var username = req.session.user.username;

    // Validate check-in code format
    if (!isValidCheckInCode(checkInCode)) {
        return res.status(400).json({ error: 'Invalid check-in code format' });
    }

    // Basic date/time format validation
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    if (!/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ error: 'Invalid time format' });
    }

    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        var query = `INSERT INTO check_ins (check_in_code, date_, time_, username)
                     VALUES (?, ?, ?, ?);`;

        connection.query(query, [checkInCode, date, time, username], function(err, result) {
            connection.release();

            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ error: 'Check-in failed' });
            }

            res.status(201).json({
                success: true,
                message: 'Check-in recorded successfully'
            });
        });
    });
});

/**
 * POST /users/history
 * Get the current user's check-in history
 *
 * Protected route - requires authentication
 *
 * Returns an array of check-in records for the logged-in user only.
 *
 * Security Note: We filter by the session username to ensure users
 * can only see their own check-in history, not other users' data.
 */
router.post('/history', requireAuth, function(req, res, next) {
    // Get username from session (secure)
    var username = req.session.user.username;

    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        // Only return check-ins for the current user (security fix)
        var query = `SELECT check_in_code, date_, time_
                     FROM check_ins
                     WHERE username = ?
                     ORDER BY date_ DESC, time_ DESC;`;

        connection.query(query, [username], function(err, rows, fields) {
            connection.release();

            if (err) {
                console.error('Query error:', err);
                return res.status(500).json({ error: 'Failed to retrieve history' });
            }

            res.json(rows);
        });
    });
});

module.exports = router;
