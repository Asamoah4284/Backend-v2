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
userSchema.statics.awardReferralPoints = async function(referralCode, newUserId) {
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

    // Award points to referrer (100 points for successful referral)
    await referrer.addPoints(100);

    // New user gets 0 points (no bonus for using a referral code)
    // await newUser.addPoints(50); // Removed this line

    return {
      referrer: referrer,
      newUser: newUser,
      referrerPointsAwarded: 100,
      newUserPointsAwarded: 0
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

// Get user without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 