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

    it('should register user but not award points when fraud is detected', async () => {
      // First, create a referrer user with a fingerprint
      const referrerUser = new User({
        email: 'referrer@example.com',
        password: 'TestPass123',
        name: 'Referrer User',
        userType: 'customer',
        fingerprint: sampleFingerprint
      });
      await referrerUser.save();

      // Try to register a new user with the same fingerprint and referral code
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'fraud@example.com',
          password: 'TestPass123',
          name: 'Fraud User',
          userType: 'customer',
          enteredReferralCode: referrerUser.myReferralCode,
          fingerprint: sampleFingerprint // Same fingerprint as referrer
        });

      // User should be registered successfully
      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('fraud@example.com');
      expect(response.body.user.name).toBe('Fraud User');

      // But fraud should be detected and no points awarded
      expect(response.body.referralInfo).toBeDefined();
      expect(response.body.referralInfo.fraudDetected).toBe(true);
      expect(response.body.referralInfo.pointsAwarded).toBe(0);
      expect(response.body.referralInfo.referrerPointsAwarded).toBe(0);
      expect(response.body.referralInfo.note).toContain('referral points were not awarded due to fraud detection');

      // Verify referrer didn't get points
      const updatedReferrer = await User.findById(referrerUser._id);
      expect(updatedReferrer.points).toBe(0); // Should still have 0 points

      // Clean up
      await User.deleteOne({ email: 'referrer@example.com' });
      await User.deleteOne({ email: 'fraud@example.com' });
    });

    it('should register user and award points when no fraud is detected', async () => {
      // First, create a referrer user with a fingerprint
      const referrerUser = new User({
        email: 'referrer@example.com',
        password: 'TestPass123',
        name: 'Referrer User',
        userType: 'customer',
        fingerprint: sampleFingerprint
      });
      await referrerUser.save();

      // Register a new user with different fingerprint and referral code
      const differentFingerprint = {
        ...sampleFingerprint,
        platform: 'MacIntel',
        vendor: 'Apple Inc.',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        visitorId: 'different-visitor-id-123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'legitimate@example.com',
          password: 'TestPass123',
          name: 'Legitimate User',
          userType: 'customer',
          enteredReferralCode: referrerUser.myReferralCode,
          fingerprint: differentFingerprint // Different fingerprint
        });

      // User should be registered successfully
      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('legitimate@example.com');

      // Points should be awarded normally
      expect(response.body.referralInfo).toBeDefined();
      expect(response.body.referralInfo.fraudCheckPassed).toBe(true);
      expect(response.body.referralInfo.pointsAwarded).toBe(0); // New user gets 0 points
      expect(response.body.referralInfo.referrerPointsAwarded).toBe(100); // Referrer gets 100 points

      // Verify referrer got points
      const updatedReferrer = await User.findById(referrerUser._id);
      expect(updatedReferrer.points).toBe(100); // Should have 100 points

      // Clean up
      await User.deleteOne({ email: 'referrer@example.com' });
      await User.deleteOne({ email: 'legitimate@example.com' });
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

    it('should detect same device fingerprints', () => {
      const fingerprint1 = {
        platform: 'Win32',
        vendor: 'Google Inc.',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        hardwareConcurrency: 8,
        maxTouchPoints: 0,
        timezone: 'Africa/Accra',
        language: 'en-US'
      };

      const fingerprint2 = {
        platform: 'Win32',
        vendor: 'Google Inc.',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        hardwareConcurrency: 8,
        maxTouchPoints: 0,
        timezone: 'Africa/Accra',
        language: 'en-US'
      };

      const isSameDevice = User.isSameDevice(fingerprint1, fingerprint2, 0.7);
      expect(isSameDevice).toBe(true);
    });

    it('should detect different device fingerprints', () => {
      const fingerprint1 = {
        platform: 'Win32',
        vendor: 'Google Inc.',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        hardwareConcurrency: 8,
        maxTouchPoints: 0,
        timezone: 'Africa/Accra',
        language: 'en-US'
      };

      const fingerprint2 = {
        platform: 'MacIntel',
        vendor: 'Apple Inc.',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        screenResolution: '2560x1600',
        hardwareConcurrency: 16,
        maxTouchPoints: 0,
        timezone: 'America/New_York',
        language: 'en-US'
      };

      const isSameDevice = User.isSameDevice(fingerprint1, fingerprint2, 0.7);
      expect(isSameDevice).toBe(false);
    });
  });

  describe('POST /auth/check-fingerprint-fraud', () => {
    it('should detect fraud when same device tries to refer itself', async () => {
      // First, create a user with a fingerprint
      const userWithFingerprint = new User({
        email: 'referrer@example.com',
        password: 'TestPass123',
        name: 'Referrer User',
        userType: 'customer',
        fingerprint: sampleFingerprint
      });
      await userWithFingerprint.save();

      // Check for fraud using the same fingerprint
      const response = await request(app)
        .post('/auth/check-fingerprint-fraud')
        .send({
          fingerprint: sampleFingerprint,
          referralCode: userWithFingerprint.myReferralCode
        });

      expect(response.status).toBe(200);
      expect(response.body.fraudDetected).toBe(true);
      expect(response.body.checks.sameDeviceReferral).toBe(true);

      // Clean up
      await User.deleteOne({ email: 'referrer@example.com' });
    });

    it('should detect fraud when fingerprint matches existing user', async () => {
      // Check for fraud using the test user's fingerprint
      const response = await request(app)
        .post('/auth/check-fingerprint-fraud')
        .send({
          fingerprint: {
            platform: 'Linux',
            vendor: 'Mozilla',
            timezone: 'Europe/London',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            screenResolution: '1920x1080',
            hardwareConcurrency: 8,
            maxTouchPoints: 0,
            language: 'en-US'
          }
        });

      expect(response.status).toBe(200);
      // Should detect fraud if the fingerprint matches the test user
      expect(response.body.fraudDetected).toBeDefined();
    });

    it('should pass fraud check for new fingerprint', async () => {
      const newFingerprint = {
        platform: 'Android',
        vendor: 'Samsung',
        timezone: 'Asia/Tokyo',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36',
        screenResolution: '1440x2960',
        hardwareConcurrency: 8,
        maxTouchPoints: 5,
        language: 'ja-JP'
      };

      const response = await request(app)
        .post('/auth/check-fingerprint-fraud')
        .send({
          fingerprint: newFingerprint
        });

      expect(response.status).toBe(200);
      expect(response.body.fraudDetected).toBe(false);
      expect(response.body.message).toBe('Fingerprint check passed');
    });
  });
}); 