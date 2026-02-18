/**
 * CovidWatch - User Routes
 *
 * This file handles user-related operations including:
 * - Authentication (login/logout)
 * - User registration (signup)
 * - Venue check-ins
 * - Check-in history retrieval
 *
 * Security features:
 * - bcrypt password hashing with salt
 * - Rate limiting on authentication endpoints
 * - Schema-based input validation
 * - Parameterized SQL queries
 */

var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

// Security middleware
var security = require('../middleware/security');
var validation = require('../middleware/validation');

// bcrypt configuration: 12 rounds provides good security/performance balance
var BCRYPT_ROUNDS = 12;

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
 * Allowed fields for each endpoint
 * Used to reject requests with unexpected fields (parameter pollution prevention)
 */
var ALLOWED_FIELDS = {
    login: ['user', 'pass'],
    signup: ['user', 'pass', 'email', 'given_name', 'family_name', 'type'],
    checkIn: ['check_in', 'date', 'time']
};

/**
 * POST /users/login
 * Authenticate a user with username and password
 *
 * Security features:
 * - Rate limited: 5 attempts per 15 minutes
 * - bcrypt password verification
 * - Generic error messages prevent username enumeration
 * - Input validation and sanitization
 */
router.post('/login',
    security.authLimiter,
    security.rejectUnexpectedFields(ALLOWED_FIELDS.login),
    validation.loginValidation,
    function(req, res, next) {
        var username = req.body.user;
        var password = req.body.pass;

        req.pool.getConnection(function(err, connection) {
            if (err) {
                console.error('Database connection error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            // First, get the user by username only
            var query = 'SELECT u_id, given_name, family_name, username, password, email_address, user_type FROM user WHERE username = ?;';

            connection.query(query, [username], function(err, rows) {
                if (err) {
                    connection.release();
                    console.error('Query error:', err);
                    return res.status(500).json({ error: 'Server error' });
                }

                if (rows.length === 0) {
                    connection.release();
                    // Generic error prevents username enumeration
                    return res.status(401).json({ error: 'Invalid username or password' });
                }

                var user = rows[0];
                var storedHash = user.password;

                // Check if password is bcrypt hash or legacy SHA-256
                var isBcryptHash = storedHash && storedHash.startsWith('$2');

                if (isBcryptHash) {
                    // Verify with bcrypt
                    bcrypt.compare(password, storedHash, function(err, match) {
                        connection.release();

                        if (err) {
                            console.error('bcrypt error:', err);
                            return res.status(500).json({ error: 'Server error' });
                        }

                        if (match) {
                            // Store user info in session (excluding password)
                            req.session.user = {
                                u_id: user.u_id,
                                given_name: user.given_name,
                                family_name: user.family_name,
                                username: user.username,
                                email_address: user.email_address,
                                user_type: user.user_type
                            };
                            res.json({
                                success: true,
                                username: user.username,
                                user_type: user.user_type
                            });
                        } else {
                            res.status(401).json({ error: 'Invalid username or password' });
                        }
                    });
                } else {
                    // Legacy SHA-256 hash - verify and upgrade to bcrypt
                    var shaQuery = 'SELECT u_id FROM user WHERE username = ? AND password = SHA2(?, 256);';

                    connection.query(shaQuery, [username, password], function(err, shaRows) {
                        if (err) {
                            connection.release();
                            console.error('Query error:', err);
                            return res.status(500).json({ error: 'Server error' });
                        }

                        if (shaRows.length > 0) {
                            // Password matches legacy hash, upgrade to bcrypt
                            bcrypt.hash(password, BCRYPT_ROUNDS, function(err, hash) {
                                if (err) {
                                    connection.release();
                                    console.error('bcrypt hash error:', err);
                                    // Still allow login even if upgrade fails
                                    req.session.user = {
                                        u_id: user.u_id,
                                        given_name: user.given_name,
                                        family_name: user.family_name,
                                        username: user.username,
                                        email_address: user.email_address,
                                        user_type: user.user_type
                                    };
                                    return res.json({
                                        success: true,
                                        username: user.username,
                                        user_type: user.user_type
                                    });
                                }

                                // Update password to bcrypt hash
                                var updateQuery = 'UPDATE user SET password = ? WHERE u_id = ?;';
                                connection.query(updateQuery, [hash, user.u_id], function(err) {
                                    connection.release();

                                    if (err) {
                                        console.error('Password upgrade error:', err);
                                    }

                                    // Login successful
                                    req.session.user = {
                                        u_id: user.u_id,
                                        given_name: user.given_name,
                                        family_name: user.family_name,
                                        username: user.username,
                                        email_address: user.email_address,
                                        user_type: user.user_type
                                    };
                                    res.json({
                                        success: true,
                                        username: user.username,
                                        user_type: user.user_type
                                    });
                                });
                            });
                        } else {
                            connection.release();
                            res.status(401).json({ error: 'Invalid username or password' });
                        }
                    });
                }
            });
        });
    }
);

/**
 * POST /users/logout
 * End the user's session
 *
 * Security: Destroys entire session to ensure complete cleanup
 */
router.post('/logout', function(req, res, next) {
    if (req.session) {
        req.session.destroy(function(err) {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            // Clear the session cookie
            res.clearCookie('sessionId');
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
 * Security features:
 * - Rate limited: 5 attempts per 15 minutes
 * - Strong password requirements enforced
 * - bcrypt password hashing with salt
 * - Input validation and sanitization
 * - Rejects unexpected fields
 */
router.post('/signup',
    security.authLimiter,
    security.rejectUnexpectedFields(ALLOWED_FIELDS.signup),
    validation.signupValidation,
    function(req, res, next) {
        var username = req.body.user;
        var password = req.body.pass;
        var email = req.body.email;
        var givenName = req.body.given_name;
        var familyName = req.body.family_name;
        var userType = req.body.type;

        // Hash password with bcrypt
        bcrypt.hash(password, BCRYPT_ROUNDS, function(err, hash) {
            if (err) {
                console.error('bcrypt error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            req.pool.getConnection(function(err, connection) {
                if (err) {
                    console.error('Database connection error:', err);
                    return res.status(500).json({ error: 'Server error' });
                }

                // Check if username already exists
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

                    // Check if email already exists
                    var emailCheckQuery = 'SELECT email_address FROM user WHERE email_address = ?;';

                    connection.query(emailCheckQuery, [email], function(err, emailRows) {
                        if (err) {
                            connection.release();
                            console.error('Query error:', err);
                            return res.status(500).json({ error: 'Server error' });
                        }

                        if (emailRows.length > 0) {
                            connection.release();
                            return res.status(409).json({ error: 'Email already registered' });
                        }

                        // Insert new user with bcrypt-hashed password
                        var insertQuery = 'INSERT INTO user (given_name, family_name, username, password, email_address, user_type) VALUES (?, ?, ?, ?, ?, ?);';

                        connection.query(insertQuery, [givenName, familyName, username, hash, email, userType],
                            function(err, result) {
                                connection.release();

                                if (err) {
                                    console.error('Insert error:', err);
                                    if (err.code === 'ER_DUP_ENTRY') {
                                        return res.status(409).json({ error: 'Username or email already exists' });
                                    }
                                    return res.status(500).json({ error: 'Registration failed' });
                                }

                                res.status(201).json({
                                    success: true,
                                    message: 'Account created successfully'
                                });
                            });
                    });
                });
            });
        });
    }
);

/**
 * POST /users/check_in
 * Record a venue check-in for COVID contact tracing
 *
 * Security features:
 * - Requires authentication
 * - Rate limited for write operations
 * - Input validation
 * - Username taken from session (prevents impersonation)
 */
router.post('/check_in',
    requireAuth,
    security.writeLimiter,
    security.rejectUnexpectedFields(ALLOWED_FIELDS.checkIn),
    validation.checkInValidation,
    function(req, res, next) {
        var checkInCode = req.body.check_in;
        var date = req.body.date;
        var time = req.body.time;
        var username = req.session.user.username;

        req.pool.getConnection(function(err, connection) {
            if (err) {
                console.error('Database connection error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            var query = 'INSERT INTO check_ins (check_in_code, date_, time_, username) VALUES (?, ?, ?, ?);';

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
    }
);

/**
 * POST /users/history
 * Get the current user's check-in history
 *
 * Security features:
 * - Requires authentication
 * - Only returns data for the authenticated user
 */
router.post('/history', requireAuth, function(req, res, next) {
    var username = req.session.user.username;

    req.pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        var query = 'SELECT check_in_code, date_, time_ FROM check_ins WHERE username = ? ORDER BY date_ DESC, time_ DESC;';

        connection.query(query, [username], function(err, rows) {
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
