const express = require('express');
const User = require('../models/User');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// POST /auth/register
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      userType,
      enteredReferralCode,
      businessName,
      businessCategory,
      businessDescription,
      phone,
      country,
      city,
      website
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email'
      });
    }

    // Validate entered referral code if provided
    let referrer = null;
    if (enteredReferralCode) {
      referrer = await User.findByReferralCode(enteredReferralCode);
      if (!referrer) {
        return res.status(400).json({
          error: 'Invalid referral code'
        });
      }
      
      // Prevent self-referral
      if (referrer.email === email) {
        return res.status(400).json({
          error: 'You cannot refer yourself'
        });
      }
    }

    // Create user data object
    const userData = {
      email,
      password,
      name,
      userType,
      enteredReferralCode: enteredReferralCode || null
    };

    // Add artisan-specific fields if user type is artisan
    if (userType === 'artisan') {
      userData.businessName = businessName;
      userData.businessCategory = businessCategory;
      userData.businessDescription = businessDescription;
      userData.phone = phone;
      userData.country = country;
      userData.city = city;
      if (website) userData.website = website;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Award referral points if valid referrer code was used
    let referralResult = null;
    if (enteredReferralCode && referrer) {
      try {
        referralResult = await User.awardReferralPoints(enteredReferralCode, user._id);
      } catch (error) {
        console.error('Error awarding referral points:', error);
        // Don't fail registration if referral points fail
      }
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Prepare response
    const responseData = {
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        points: user.points,
        myReferralCode: user.myReferralCode,
        enteredReferralCode: user.enteredReferralCode,
        businessName: user.businessName,
        businessCategory: user.businessCategory,
        country: user.country,
        city: user.city
      },
      token
    };

    // Add referral information if points were awarded
    if (referralResult) {
      responseData.referralInfo = {
        referrerName: referrer.name,
        pointsAwarded: referralResult.newUserPointsAwarded,
        referrerPointsAwarded: referralResult.referrerPointsAwarded
      };
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// POST /auth/login
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        points: user.points,
        myReferralCode: user.myReferralCode,
        enteredReferralCode: user.enteredReferralCode,
        businessName: user.businessName,
        businessCategory: user.businessCategory,
        businessDescription: user.businessDescription,
        phone: user.phone,
        country: user.country,
        city: user.city,
        website: user.website,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

module.exports = router; 