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
      confirmPassword,
      name, 
      userType,
      enteredReferralCode,
      businessName,
      businessCategory,
      businessDescription,
      phone,
      country,
      city,
      website,
      fingerprint
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

    // Add fingerprint data if provided
    if (fingerprint) {
      userData.fingerprint = fingerprint;
    }

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
    let fraudDetected = false;
    let fraudDetails = null;
    
    if (enteredReferralCode && referrer) {
      try {
        referralResult = await User.awardReferralPoints(enteredReferralCode, user._id, fingerprint);
      } catch (error) {
        console.error('Error awarding referral points:', error);
        
        // If it's a fraud error, note it but don't fail registration
        if (error.message.includes('Fraud detected')) {
          fraudDetected = true;
          fraudDetails = error.message;
          console.log('Referral fraud detected - user registered but no points awarded');
        }
        // Don't fail registration if other referral points errors occur
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
        city: user.city,
        fingerprint: user.fingerprint
      },
      token
    };

    // Add referral information if points were awarded
    if (referralResult) {
      responseData.referralInfo = {
        referrerName: referrer.name,
        pointsAwarded: referralResult.newUserPointsAwarded,
        referrerPointsAwarded: referralResult.referrerPointsAwarded,
        fraudCheckPassed: true
      };
    }

    // Add fraud information if fraud was detected
    if (fraudDetected) {
      responseData.referralInfo = {
        fraudDetected: true,
        fraudMessage: fraudDetails,
        pointsAwarded: 0,
        referrerPointsAwarded: 0,
        note: "User registered successfully but referral points were not awarded due to fraud detection"
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
    const { email, password, fingerprint } = req.body;

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

    // Update fingerprint data if provided
    if (fingerprint) {
      user.fingerprint = fingerprint;
      await user.save();
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
        updatedAt: user.updatedAt,
        fingerprint: user.fingerprint
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

// PUT /auth/update-fingerprint
router.put('/update-fingerprint', async (req, res) => {
  try {
    const { userId, fingerprint } = req.body;

    if (!userId || !fingerprint) {
      return res.status(400).json({
        error: 'User ID and fingerprint data are required'
      });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update fingerprint data
    await user.updateFingerprint(fingerprint);

    res.json({
      message: 'Fingerprint updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        fingerprint: user.fingerprint
      }
    });
  } catch (error) {
    console.error('Fingerprint update error:', error);
    res.status(500).json({
      error: 'Fingerprint update failed',
      message: error.message
    });
  }
});

// GET /auth/fingerprint/:userId
router.get('/fingerprint/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      fingerprint: user.getFingerprint()
    });
  } catch (error) {
    console.error('Get fingerprint error:', error);
    res.status(500).json({
      error: 'Failed to get fingerprint data',
      message: error.message
    });
  }
});

// POST /auth/check-fingerprint-fraud
router.post('/check-fingerprint-fraud', async (req, res) => {
  try {
    const { fingerprint, referralCode } = req.body;

    if (!fingerprint) {
      return res.status(400).json({
        error: 'Fingerprint data is required'
      });
    }

    const fraudChecks = {
      sameDeviceReferral: false,
      multipleAccounts: false,
      details: {}
    };

    // Check if fingerprint matches any existing user
    const existingUserWithSameFingerprint = await User.findMatchingFingerprint(fingerprint, 0.7);
    if (existingUserWithSameFingerprint) {
      fraudChecks.multipleAccounts = true;
      fraudChecks.details.existingUser = {
        id: existingUserWithSameFingerprint._id,
        email: existingUserWithSameFingerprint.email,
        name: existingUserWithSameFingerprint.name
      };
    }

    // Check for same device referral fraud if referral code is provided
    if (referralCode) {
      const referrer = await User.findByReferralCode(referralCode);
      if (referrer && referrer.fingerprint) {
        const isSameDevice = User.isSameDevice(referrer.fingerprint, fingerprint, 0.7);
        if (isSameDevice) {
          fraudChecks.sameDeviceReferral = true;
          fraudChecks.details.referrer = {
            id: referrer._id,
            email: referrer.email,
            name: referrer.name
          };
        }
      }
    }

    const hasFraud = fraudChecks.sameDeviceReferral || fraudChecks.multipleAccounts;

    res.json({
      fraudDetected: hasFraud,
      checks: fraudChecks,
      message: hasFraud ? 'Fraud detected in fingerprint data' : 'Fingerprint check passed'
    });
  } catch (error) {
    console.error('Fingerprint fraud check error:', error);
    res.status(500).json({
      error: 'Fingerprint fraud check failed',
      message: error.message
    });
  }
});

module.exports = router; 