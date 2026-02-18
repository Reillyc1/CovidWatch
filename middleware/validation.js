/**
 * CovidWatch - Input Validation Middleware
 *
 * This module provides schema-based input validation for all user inputs.
 * Uses express-validator for robust validation and sanitization.
 * Following OWASP guidelines for input validation.
 */

var { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * Returns a 400 Bad Request with details about validation failures
 */
function handleValidationErrors(req, res, next) {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(function(err) {
                return {
                    field: err.path,
                    message: err.msg
                };
            })
        });
    }
    next();
}

/**
 * Login validation schema
 * Validates username and password fields
 */
var loginValidation = [
    body('user')
        .exists({ checkFalsy: true })
        .withMessage('Username is required')
        .isString()
        .withMessage('Username must be a string')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('pass')
        .exists({ checkFalsy: true })
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Signup validation schema
 * Comprehensive validation for all registration fields
 */
var signupValidation = [
    body('user')
        .exists({ checkFalsy: true })
        .withMessage('Username is required')
        .isString()
        .withMessage('Username must be a string')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('pass')
        .exists({ checkFalsy: true })
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 8, max: 100 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),

    body('email')
        .exists({ checkFalsy: true })
        .withMessage('Email is required')
        .isString()
        .withMessage('Email must be a string')
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .isLength({ max: 254 })
        .withMessage('Email must be less than 254 characters'),

    body('given_name')
        .exists({ checkFalsy: true })
        .withMessage('First name is required')
        .isString()
        .withMessage('First name must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be 1-50 characters')
        .matches(/^[a-zA-Z\s\-']+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

    body('family_name')
        .exists({ checkFalsy: true })
        .withMessage('Last name is required')
        .isString()
        .withMessage('Last name must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be 1-50 characters')
        .matches(/^[a-zA-Z\s\-']+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

    body('type')
        .exists({ checkFalsy: true })
        .withMessage('User type is required')
        .isString()
        .withMessage('User type must be a string')
        .isIn(['user', 'manager'])
        .withMessage('User type must be either "user" or "manager"'),

    handleValidationErrors
];

/**
 * Check-in validation schema
 * Validates venue code, date, and time
 */
var checkInValidation = [
    body('check_in')
        .exists({ checkFalsy: true })
        .withMessage('Check-in code is required')
        .isString()
        .withMessage('Check-in code must be a string')
        .trim()
        .isLength({ min: 4, max: 10 })
        .withMessage('Check-in code must be 4-10 characters')
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage('Check-in code can only contain letters and numbers'),

    body('date')
        .exists({ checkFalsy: true })
        .withMessage('Date is required')
        .isString()
        .withMessage('Date must be a string')
        .matches(/^\d{4}-\d{1,2}-\d{1,2}$/)
        .withMessage('Date must be in YYYY-MM-DD format')
        .custom(function(value) {
            var date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            // Prevent future dates more than 1 day ahead
            var tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (date > tomorrow) {
                throw new Error('Date cannot be in the future');
            }
            // Prevent dates more than 30 days in the past
            var thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (date < thirtyDaysAgo) {
                throw new Error('Date cannot be more than 30 days in the past');
            }
            return true;
        }),

    body('time')
        .exists({ checkFalsy: true })
        .withMessage('Time is required')
        .isString()
        .withMessage('Time must be a string')
        .matches(/^\d{1,2}:\d{2}:\d{2}$/)
        .withMessage('Time must be in HH:MM:SS format')
        .custom(function(value) {
            var parts = value.split(':');
            var hours = parseInt(parts[0], 10);
            var minutes = parseInt(parts[1], 10);
            var seconds = parseInt(parts[2], 10);
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
                throw new Error('Invalid time values');
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Map marker validation schema
 * Validates longitude and latitude coordinates
 */
var markerValidation = [
    body('long')
        .exists()
        .withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),

    body('lat')
        .exists()
        .withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),

    handleValidationErrors
];

module.exports = {
    loginValidation: loginValidation,
    signupValidation: signupValidation,
    checkInValidation: checkInValidation,
    markerValidation: markerValidation,
    handleValidationErrors: handleValidationErrors
};
