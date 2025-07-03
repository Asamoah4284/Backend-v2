const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Fingerprint API Tests', () => {
  let testUser;
  const sampleFingerprint = {
    visitorId: "58d047a06034819c3deda39c1ab5446a",
    confidence: 0.6,
    components: ["fonts", "domBlockers", "fontPreferences", "audio", "screenFrame", "canvas", "osCpu", "languages"],
    cookieEnabled: true,
    doNotTrack: null,
    hardwareConcurrency: 8,
    language: "en-US",
    maxTouchPoints: 0,
    platform: "Win32",
    screenResolution: "1920x1080",
    timestamp: "2025-07-03T10:31:48.379Z",
    timezone: "Africa/Accra",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    vendor: "Google Inc."
  };

  beforeAll(async () => {
    // Create a test user
    testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123',
      name: 'Test User',
      userType: 'customer'
    });
    await testUser.save();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'test@example.com' });
    await mongoose.connection.close();
  });

  describe('POST /auth/register with fingerprint', () => {
    it('should register a user with fingerprint data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'fingerprint@example.com',
          password: 'TestPass123',
          name: 'Fingerprint User',
          userType: 'customer',
          fingerprint: sampleFingerprint
        });

      expect(response.status).toBe(201);
      expect(response.body.user.fingerprint).toBeDefined();
      expect(response.body.user.fingerprint.confidence).toBe(0.6);
      expect(response.body.user.fingerprint.platform).toBe('Win32');
      expect(response.body.user.fingerprint.visitorId).toBe('58d047a06034819c3deda39c1ab5446a');

      // Clean up
      await User.deleteOne({ email: 'fingerprint@example.com' });
    });

    it('should register a user with exact frontend payload structure', async () => {
      const frontendPayload = {
        name: "g",
        email: "n@h.com",
        password: "$Mack123",
        confirmPassword: "$Mack123",
        userType: "customer",
        fingerprint: {
          visitorId: "58d047a06034819c3deda39c1ab5446a",
          confidence: 0.6,
          components: ["fonts", "domBlockers", "fontPreferences", "audio", "screenFrame", "canvas", "osCpu", "languages"],
          cookieEnabled: true,
          doNotTrack: null,
          hardwareConcurrency: 8,
          language: "en-US",
          maxTouchPoints: 0,
          platform: "Win32",
          screenResolution: "1920x1080",
          timestamp: "2025-07-03T10:31:48.379Z",
          timezone: "Africa/Accra",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          vendor: "Google Inc."
        }
      };

      const response = await request(app)
        .post('/auth/register')
        .send(frontendPayload);

      expect(response.status).toBe(201);
      expect(response.body.user.fingerprint).toBeDefined();
      expect(response.body.user.fingerprint.confidence).toBe(0.6);
      expect(response.body.user.fingerprint.platform).toBe('Win32');
      expect(response.body.user.fingerprint.visitorId).toBe('58d047a06034819c3deda39c1ab5446a');
      expect(response.body.user.fingerprint.components).toEqual(["fonts", "domBlockers", "fontPreferences", "audio", "screenFrame", "canvas", "osCpu", "languages"]);

      // Clean up
      await User.deleteOne({ email: 'n@h.com' });
    });
  });

  describe('POST /auth/login with fingerprint', () => {
    it('should login and update fingerprint data', async () => {
      const updatedFingerprint = {
        ...sampleFingerprint,
        confidence: 0.8,
        visitorId: 'updated-visitor-id-456'
      };

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123',
          fingerprint: updatedFingerprint
        });

      expect(response.status).toBe(200);
      expect(response.body.user.fingerprint).toBeDefined();
      expect(response.body.user.fingerprint.confidence).toBe(0.8);
      expect(response.body.user.fingerprint.visitorId).toBe('updated-visitor-id-456');
    });
  });

  describe('PUT /auth/update-fingerprint', () => {
    it('should update fingerprint data for existing user', async () => {
      const newFingerprint = {
        confidence: 0.9,
        components: ["fonts", "canvas", "audio"],
        platform: "Linux",
        vendor: "Mozilla",
        timezone: "Europe/London",
        visitorId: 'new-visitor-id-789'
      };

      const response = await request(app)
        .put('/auth/update-fingerprint')
        .send({
          userId: testUser._id.toString(),
          fingerprint: newFingerprint
        });

      expect(response.status).toBe(200);
      expect(response.body.user.fingerprint.confidence).toBe(0.9);
      expect(response.body.user.fingerprint.platform).toBe('Linux');
      expect(response.body.user.fingerprint.visitorId).toBe('new-visitor-id-789');
    });
  });

  describe('GET /auth/fingerprint/:userId', () => {
    it('should get fingerprint data for a user', async () => {
      const response = await request(app)
        .get(`/auth/fingerprint/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.fingerprint).toBeDefined();
      expect(response.body.fingerprint.confidence).toBe(0.9);
    });
  });

  describe('User model fingerprint methods', () => {
    it('should find user by visitor ID', async () => {
      const foundUser = await User.findByVisitorId('new-visitor-id-789');
      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(testUser._id.toString());
    });

    it('should find users with similar fingerprints', async () => {
      const similarUsers = await User.findSimilarFingerprints({
        platform: 'Linux',
        vendor: 'Mozilla',
        timezone: 'Europe/London'
      });
      expect(similarUsers.length).toBeGreaterThan(0);
    });
  });
}); 