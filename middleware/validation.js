const { body, validationResult } = require('express-validator');

// Validation middleware for user registration
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
    .withMessage('Password confirmation does not match password'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters long')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('userType')
    .isIn(['customer', 'artisan'])
    .withMessage('User type must be either customer or artisan'),
  body('enteredReferralCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Entered referral code must be between 1 and 50 characters long')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Entered referral code can only contain uppercase letters and numbers'),
  // Fingerprint validation
  body('fingerprint')
    .optional()
    .isObject()
    .withMessage('Fingerprint must be an object'),
  body('fingerprint.visitorId')
    .optional()
    .isString()
    .withMessage('Fingerprint visitor ID must be a string'),
  body('fingerprint.confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Fingerprint confidence must be a number between 0 and 1'),
  body('fingerprint.components')
    .optional()
    .isArray()
    .withMessage('Fingerprint components must be an array'),
  body('fingerprint.cookieEnabled')
    .optional()
    .isBoolean()
    .withMessage('Fingerprint cookie enabled must be a boolean'),
  body('fingerprint.doNotTrack')
    .optional()
    .custom((value) => {
      return value === null || typeof value === 'string' || typeof value === 'boolean';
    })
    .withMessage('Fingerprint do not track must be null, string, or boolean'),
  body('fingerprint.hardwareConcurrency')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Fingerprint hardware concurrency must be a non-negative integer'),
  body('fingerprint.language')
    .optional()
    .isString()
    .withMessage('Fingerprint language must be a string'),
  body('fingerprint.maxTouchPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Fingerprint max touch points must be a non-negative integer'),
  body('fingerprint.platform')
    .optional()
    .isString()
    .withMessage('Fingerprint platform must be a string'),
  body('fingerprint.screenResolution')
    .optional()
    .isString()
    .withMessage('Fingerprint screen resolution must be a string'),
  body('fingerprint.timestamp')
    .optional()
    .isISO8601()
    .withMessage('Fingerprint timestamp must be a valid ISO 8601 date string'),
  body('fingerprint.timezone')
    .optional()
    .isString()
    .withMessage('Fingerprint timezone must be a string'),
  body('fingerprint.userAgent')
    .optional()
    .isString()
    .withMessage('Fingerprint user agent must be a string'),
  body('fingerprint.vendor')
    .optional()
    .isString()
    .withMessage('Fingerprint vendor must be a string'),
  // Conditional validation for artisan fields
  body('businessName')
    .if(body('userType').equals('artisan'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters long'),
  body('businessCategory')
    .if(body('userType').equals('artisan'))
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Business category must be between 2 and 50 characters long'),
  body('businessDescription')
    .if(body('userType').equals('artisan'))
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Business description must be between 10 and 2000 characters long'),
  body('phone')
    .if(body('userType').equals('artisan'))
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters long'),
  body('country')
    .if(body('userType').equals('artisan'))
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters long'),
  body('city')
    .if(body('userType').equals('artisan'))
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters long'),
  body('website')
    .if(body('userType').equals('artisan'))
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
];

// Validation middleware for user login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  // Fingerprint validation for login
  body('fingerprint')
    .optional()
    .isObject()
    .withMessage('Fingerprint must be an object'),
  body('fingerprint.visitorId')
    .optional()
    .isString()
    .withMessage('Fingerprint visitor ID must be a string'),
  body('fingerprint.confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Fingerprint confidence must be a number between 0 and 1'),
  body('fingerprint.components')
    .optional()
    .isArray()
    .withMessage('Fingerprint components must be an array'),
  body('fingerprint.cookieEnabled')
    .optional()
    .isBoolean()
    .withMessage('Fingerprint cookie enabled must be a boolean'),
  body('fingerprint.doNotTrack')
    .optional()
    .custom((value) => {
      return value === null || typeof value === 'string' || typeof value === 'boolean';
    })
    .withMessage('Fingerprint do not track must be null, string, or boolean'),
  body('fingerprint.hardwareConcurrency')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Fingerprint hardware concurrency must be a non-negative integer'),
  body('fingerprint.language')
    .optional()
    .isString()
    .withMessage('Fingerprint language must be a string'),
  body('fingerprint.maxTouchPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Fingerprint max touch points must be a non-negative integer'),
  body('fingerprint.platform')
    .optional()
    .isString()
    .withMessage('Fingerprint platform must be a string'),
  body('fingerprint.screenResolution')
    .optional()
    .isString()
    .withMessage('Fingerprint screen resolution must be a string'),
  body('fingerprint.timestamp')
    .optional()
    .isISO8601()
    .withMessage('Fingerprint timestamp must be a valid ISO 8601 date string'),
  body('fingerprint.timezone')
    .optional()
    .isString()
    .withMessage('Fingerprint timezone must be a string'),
  body('fingerprint.userAgent')
    .optional()
    .isString()
    .withMessage('Fingerprint user agent must be a string'),
  body('fingerprint.vendor')
    .optional()
    .isString()
    .withMessage('Fingerprint vendor must be a string')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  handleValidationErrors
}; 