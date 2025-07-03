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
    .withMessage('Password is required')
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