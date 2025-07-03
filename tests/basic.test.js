const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('The Artisan\'s Circle API', () => {
  beforeAll(async () => {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/artisans-circle-test');
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('The Artisan\'s Circle API');
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        userType: 'customer'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    it('should login an existing user', async () => {
      const userData = {
        email: 'login@example.com',
        password: 'Password123',
        name: 'Login User',
        userType: 'customer'
      };

      // Register user first
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Login
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid login credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('Protected Routes', () => {
    let authToken;

    beforeAll(async () => {
      // Create a user and get token
      const userData = {
        email: 'protected@example.com',
        password: 'Password123',
        name: 'Protected User',
        userType: 'customer'
      };

      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData);

      authToken = registerResponse.body.token;
    });

    it('should access protected dashboard with valid token', async () => {
      const response = await request(app)
        .get('/app/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/app/dashboard')
        .expect(401);

      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });
}); 