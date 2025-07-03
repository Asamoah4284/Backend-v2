const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// GET /app/dashboard - Get user info and orders
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Validate that user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        error: 'User not authenticated',
        message: 'Please log in to access your dashboard'
      });
    }

    const userId = req.user._id;
    console.log('Dashboard request for user:', userId);

    // Get user's orders with product and artisan details
    const orders = await Order.find({ userId: userId.toString() }).sort({ createdAt: -1 });
    console.log('Found orders:', orders.length);
    
    // For each order, populate product and artisan info
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      try {
        // Each order.items is an array of { productId, quantity, ... }
        const detailedItems = await Promise.all((order.items || []).map(async (item) => {
          try {
            const product = await Product.findById(item.productId).populate('artisan', 'name specialty imageUrl');
            return {
              ...item,
              product: product ? {
                _id: product._id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                artisan: product.artisan ? {
                  _id: product.artisan._id,
                  name: product.artisan.name,
                  specialty: product.artisan.specialty,
                  imageUrl: product.artisan.imageUrl
                } : null
              } : null
            };
          } catch (itemError) {
            console.error('Error processing order item:', itemError);
            return {
              ...item,
              product: null
            };
          }
        }));
        return {
          _id: order._id,
          total: order.total,
          reference: order.reference,
          createdAt: order.createdAt,
          items: detailedItems
        };
      } catch (orderError) {
        console.error('Error processing order:', orderError);
        return {
          _id: order._id,
          total: order.total,
          reference: order.reference,
          createdAt: order.createdAt,
          items: []
        };
      }
    }));

    console.log('Dashboard response prepared successfully');

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        points: req.user.points
      },
      orders: ordersWithDetails
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// POST /orders - Save a new order
router.post('/orders', async (req, res) => {
  console.log('=== ORDER CREATION DEBUG ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.originalUrl);
  
  try {
    const { userId, items, total, reference } = req.body;
    
    console.log('Extracted data:');
    console.log('  - userId:', userId, typeof userId);
    console.log('  - items:', items, typeof items);
    console.log('  - total:', total, typeof total);
    console.log('  - reference:', reference, typeof reference);
    
    // Validate required fields
    if (!userId) {
      console.error('❌ Missing userId');
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!items || !Array.isArray(items)) {
      console.error('❌ Missing or invalid items array');
      return res.status(400).json({ error: 'items array is required' });
    }
    if (!total || typeof total !== 'number') {
      console.error('❌ Missing or invalid total');
      return res.status(400).json({ error: 'total number is required' });
    }
    if (!reference) {
      console.error('❌ Missing reference');
      return res.status(400).json({ error: 'reference is required' });
    }
    
    console.log('✅ All required fields present');
    
    const order = new Order({ userId, items, total, reference, createdAt: new Date() });
    console.log('📋 Order object created:', order);
    
    console.log('💾 Attempting to save order to database...');
    const savedOrder = await order.save();
    console.log('✅ Order saved successfully:', savedOrder);
    
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('💥 Order creation error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to save order', details: err.message });
  }
});

// GET /orders - Get all orders for a user
router.get('/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /referrals - Process referral code
router.post('/referrals', async (req, res) => {
  console.log('=== REFERRAL PROCESSING DEBUG ===');
  console.log('Request body:', req.body);
  
  try {
    const { referralCode, userEmail } = req.body;
    
    console.log('Extracted data:');
    console.log('  - referralCode:', referralCode, typeof referralCode);
    console.log('  - userEmail:', userEmail, typeof userEmail);
    
    // Validate required fields
    if (!referralCode) {
      console.error('❌ Missing referralCode');
      return res.status(400).json({ error: 'referralCode is required' });
    }
    if (!userEmail) {
      console.error('❌ Missing userEmail');
      return res.status(400).json({ error: 'userEmail is required' });
    }
    
    console.log('✅ All required fields present');
    
    // Find user by email
    console.log('🔍 Searching for user with email:', userEmail);
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    
    if (!user) {
      console.error('❌ User not found with email:', userEmail);
      return res.status(404).json({ 
        error: 'User not found',
        message: 'No user found with the provided email address'
      });
    }
    
    console.log('✅ User found:', user._id);
    
    // Update user's referral code
    console.log('📝 Updating referral code for user:', user._id);
    user.referralCode = referralCode;
    user.updatedAt = new Date();
    
    const updatedUser = await user.save();
    console.log('✅ Referral code updated successfully');
    
    // Send confirmation response
    res.status(200).json({
      message: 'Referral code updated successfully',
      data: {
        userId: updatedUser._id,
        email: updatedUser.email,
        referralCode: updatedUser.referralCode,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (err) {
    console.error('💥 Referral processing error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to process referral', details: err.message });
  }
});

// GET /users - Get all users with pagination and filtering
router.get('/users', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      userType, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by user type
    if (userType && ['customer', 'artisan'].includes(userType)) {
      query.userType = userType;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password from response
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
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
    }));
    
    res.json({
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      filters: {
        userType: userType || 'all',
        search: search || '',
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /users/:userId - Get specific user details
router.get('/users/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!userId || userId.length !== 24) {
      return res.status(400).json({
        error: 'Invalid user ID format',
        message: 'User ID must be a valid 24-character MongoDB ObjectId'
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId).select('-password'); // Exclude password
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }
    
    // Format response
    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
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
      fingerprint: user.fingerprint // Include fingerprint data if available
    };
    
    res.json({
      message: 'User details retrieved successfully',
      user: userDetails
    });
  } catch (error) {
    console.error('Get user details error:', error);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Invalid user ID format',
        message: 'User ID must be a valid 24-character MongoDB ObjectId'
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

module.exports = router; 