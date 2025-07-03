const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('User Registration', () => {
  beforeAll(async () => {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/kola-hackathon-test');
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('POST /auth/register', () => {
    it('should register a customer successfully', async () => {
      const customerData = {
        email: 'customer@example.com',
        password: 'Password123',
        name: 'John Doe',
        userType: 'customer'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(customerData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(customerData.email);
      expect(response.body.user.name).toBe(customerData.name);
      expect(response.body.user.userType).toBe('customer');
      expect(response.body.user.points).toBe(0);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should register an artisan successfully', async () => {
      const artisanData = {
        email: 'artisan@example.com',
        password: 'Password123',
        name: 'Jane Smith',
        userType: 'artisan',
        businessName: 'African Crafts Co',
        businessCategory: 'Arts & Crafts',
        businessDescription: 'Handcrafted African art and crafts',
        phone: '+2341234567890',
        country: 'Nigeria',
        city: 'Lagos',
        website: 'https://africancrafts.com'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(artisanData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(artisanData.email);
      expect(response.body.user.name).toBe(artisanData.name);
      expect(response.body.user.userType).toBe('artisan');
      expect(response.body.user.businessName).toBe(artisanData.businessName);
      expect(response.body.user.businessCategory).toBe(artisanData.businessCategory);
      expect(response.body.user.country).toBe(artisanData.country);
      expect(response.body.user.city).toBe(artisanData.city);
      expect(response.body.token).toBeDefined();
    });

    it('should reject registration with existing email', async () => {
      // First registration
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        userType: 'customer'
      };

      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User already exists with this email');
    });

    it('should validate required fields for customer', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: '', // Empty name
        userType: 'customer'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate required fields for artisan', async () => {
      const invalidData = {
        email: 'artisan@example.com',
        password: 'Password123',
        name: 'Jane Smith',
        userType: 'artisan',
        // Missing required artisan fields
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should hash password correctly', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        userType: 'customer'
      };

      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Check that password is hashed in database
      const user = await User.findOne({ email: userData.email });
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt hash pattern
    });

    it('should validate userType enum', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        userType: 'invalid_type'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });
}); 