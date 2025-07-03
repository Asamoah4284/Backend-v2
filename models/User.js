const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  userType: {
    type: String,
    enum: ['customer', 'artisan'],
    required: [true, 'User type is required'],
    default: 'customer'
  },
  // Fingerprint data fields
  fingerprint: {
    visitorId: {
      type: String,
      sparse: true // Allows multiple null values but enforces uniqueness for non-null values
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    components: {
      type: [String], // Array of component names
      default: []
    },
    cookieEnabled: {
      type: Boolean,
      default: false
    },
    doNotTrack: {
      type: mongoose.Schema.Types.Mixed, // Can be null, string, or boolean
      default: null
    },
    hardwareConcurrency: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: 'en-US'
    },
    maxTouchPoints: {
      type: Number,
      default: 0
    },
    platform: {
      type: String,
      default: ''
    },
    screenResolution: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    timezone: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    vendor: {
      type: String,
      default: ''
    }
  },
  // Customer fields
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  myReferralCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Referral code cannot exceed 50 characters']
  },
  // Code that user entered during registration (who referred them)
  enteredReferralCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Entered referral code cannot exceed 50 characters'],
    default: null
  },
  // Artisan fields
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Business category cannot exceed 50 characters']
  },
  businessDescription: {
    type: String,
    maxlength: [2000, 'Business description cannot exceed 2000 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  country: {
    type: String,
    trim: true,
    maxlength: [50, 'Country cannot exceed 50 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code for new users
userSchema.pre('save', async function(next) {
  // Only generate referral code for new users who don't have one
  if (this.isNew && !this.myReferralCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.myReferralCode = result;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Add points method
userSchema.methods.addPoints = function(points) {
  this.points += points;
  return this.save();
};

// Find user by referral code (static method)
userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ myReferralCode: referralCode });
};

// Award referral points to both referrer and new user
userSchema.statics.awardReferralPoints = async function(referralCode, newUserId, newUserFingerprint = null) {
  try {
    // Find the referrer by their referral code
    const referrer = await this.findByReferralCode(referralCode);
    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    // Find the new user
    const newUser = await this.findById(newUserId);
    if (!newUser) {
      throw new Error('New user not found');
    }

    // Check for fingerprint fraud if fingerprint data is provided
    if (newUserFingerprint) {
      // Check if this fingerprint matches the referrer's fingerprint (self-referral fraud)
      if (referrer.fingerprint && this.isSameDevice(referrer.fingerprint, newUserFingerprint, 0.7)) {
        throw new Error('Fraud detected: Same device attempting to refer itself');
      }

      // Check if this fingerprint matches any existing user (multiple account fraud)
      const existingUserWithSameFingerprint = await this.findMatchingFingerprint(newUserFingerprint, 0.7);
      if (existingUserWithSameFingerprint && existingUserWithSameFingerprint._id.toString() !== newUserId.toString()) {
        throw new Error('Fraud detected: Multiple accounts detected from same device');
      }
    }

    // Award points to referrer (100 points for successful referral)
    await referrer.addPoints(100);

    // New user gets 0 points (no bonus for using a referral code)
    // await newUser.addPoints(50); // Removed this line

    return {
      referrer: referrer,
      newUser: newUser,
      referrerPointsAwarded: 100,
      newUserPointsAwarded: 0,
      fraudCheckPassed: true
    };
  } catch (error) {
    throw error;
  }
};

// Generate unique referral code for the user
userSchema.methods.generateReferralCode = function() {
  // Generate a unique 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.myReferralCode = result;
  return this.save();
};

// Update fingerprint data
userSchema.methods.updateFingerprint = function(fingerprintData) {
  this.fingerprint = fingerprintData;
  return this.save();
};

// Get fingerprint data
userSchema.methods.getFingerprint = function() {
  return this.fingerprint;
};

// Find user by visitor ID (static method)
userSchema.statics.findByVisitorId = function(visitorId) {
  return this.findOne({ 'fingerprint.visitorId': visitorId });
};

// Find users with similar fingerprints (for fraud detection)
userSchema.statics.findSimilarFingerprints = function(fingerprintData, threshold = 0.8) {
  // This is a basic implementation - you might want to implement more sophisticated
  // fingerprint comparison logic based on your specific requirements
  const query = {};
  
  if (fingerprintData) {
    // Add specific component-based queries
    if (fingerprintData.platform) {
      query['fingerprint.platform'] = fingerprintData.platform;
    }
    if (fingerprintData.vendor) {
      query['fingerprint.vendor'] = fingerprintData.vendor;
    }
    if (fingerprintData.timezone) {
      query['fingerprint.timezone'] = fingerprintData.timezone;
    }
    if (fingerprintData.userAgent) {
      query['fingerprint.userAgent'] = fingerprintData.userAgent;
    }
    if (fingerprintData.screenResolution) {
      query['fingerprint.screenResolution'] = fingerprintData.screenResolution;
    }
  }
  
  return this.find(query);
};

// Check if two fingerprints are from the same device
userSchema.statics.isSameDevice = function(fingerprint1, fingerprint2, threshold = 0.7) {
  if (!fingerprint1 || !fingerprint2) {
    return false;
  }

  let matchCount = 0;
  let totalChecks = 0;

  // Check critical device identifiers
  const criticalFields = [
    'platform',
    'vendor', 
    'userAgent',
    'screenResolution',
    'hardwareConcurrency',
    'maxTouchPoints'
  ];

  criticalFields.forEach(field => {
    if (fingerprint1[field] && fingerprint2[field]) {
      totalChecks++;
      if (fingerprint1[field] === fingerprint2[field]) {
        matchCount++;
      }
    }
  });

  // Check timezone (should be the same for same device)
  if (fingerprint1.timezone && fingerprint2.timezone) {
    totalChecks++;
    if (fingerprint1.timezone === fingerprint2.timezone) {
      matchCount++;
    }
  }

  // Check language (should be the same for same device)
  if (fingerprint1.language && fingerprint2.language) {
    totalChecks++;
    if (fingerprint1.language === fingerprint2.language) {
      matchCount++;
    }
  }

  // Calculate similarity score
  const similarityScore = totalChecks > 0 ? matchCount / totalChecks : 0;
  
  return similarityScore >= threshold;
};

// Check if fingerprint matches any existing user (for fraud detection)
userSchema.statics.findMatchingFingerprint = function(fingerprintData, threshold = 0.7) {
  return new Promise(async (resolve, reject) => {
    try {
      const allUsers = await this.find({ 'fingerprint.visitorId': { $exists: true } });
      
      for (const user of allUsers) {
        if (user.fingerprint && this.isSameDevice(user.fingerprint, fingerprintData, threshold)) {
          resolve(user);
          return;
        }
      }
      
      resolve(null);
    } catch (error) {
      reject(error);
    }
  });
};

// Get user without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 