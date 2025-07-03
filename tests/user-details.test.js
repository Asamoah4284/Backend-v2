const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('User Details API Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create a test user
    testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123',
      name: 'Test User',
      userType: 'customer',
      points: 150,
      myReferralCode: 'TEST1234',
      fingerprint: {
        visitorId: "test-visitor-id-123",
        confidence: 0.8,
        components: ["fonts", "canvas", "audio"],
        platform: "Win32",
        vendor: "Google Inc.",
        timezone: "Africa/Accra"
      }
    });
    await testUser.save();

    // Generate auth token
    authToken = testUser.generateAuthToken();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'test@example.com' });
    await mongoose.connection.close();
  });

  describe('GET /app/users/:userId', () => {
    it('should get user details successfully', async () => {
      const response = await request(app)
        .get(`/app/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User details retrieved successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser._id.toString());
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.userType).toBe('customer');
      expect(response.body.user.points).toBe(150);
      expect(response.body.user.myReferralCode).toBe('TEST1234');
      expect(response.body.user.fingerprint).toBeDefined();
      expect(response.body.user.fingerprint.visitorId).toBe('test-visitor-id-123');
      expect(response.body.user.fingerprint.confidence).toBe(0.8);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/app/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
      expect(response.body.message).toBe('No user found with the provided ID');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/app/users/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user ID format');
      expect(response.body.message).toBe('User ID must be a valid 24-character MongoDB ObjectId');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/app/users/${testUser._id}`);

      expect(response.status).toBe(401);
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get(`/app/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should get artisan user details with business info', async () => {
      // Create an artisan user
      const artisanUser = new User({
        email: 'artisan@example.com',
        password: 'ArtisanPass123',
        name: 'Artisan User',
        userType: 'artisan',
        businessName: 'Artisan Crafts',
        businessCategory: 'Handmade',
        businessDescription: 'Beautiful handmade crafts',
        phone: '+1234567890',
        country: 'Ghana',
        city: 'Accra',
        website: 'https://artisancrafts.com',
        fingerprint: {
          visitorId: "artisan-visitor-id",
          confidence: 0.9,
          platform: "MacIntel",
          vendor: "Apple Inc."
        }
      });
      await artisanUser.save();

      const response = await request(app)
        .get(`/app/users/${artisanUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.userType).toBe('artisan');
      expect(response.body.user.businessName).toBe('Artisan Crafts');
      expect(response.body.user.businessCategory).toBe('Handmade');
      expect(response.body.user.businessDescription).toBe('Beautiful handmade crafts');
      expect(response.body.user.phone).toBe('+1234567890');
      expect(response.body.user.country).toBe('Ghana');
      expect(response.body.user.city).toBe('Accra');
      expect(response.body.user.website).toBe('https://artisancrafts.com');
      expect(response.body.user.fingerprint.visitorId).toBe('artisan-visitor-id');

      // Clean up
      await User.deleteOne({ email: 'artisan@example.com' });
    });
  });
}); 