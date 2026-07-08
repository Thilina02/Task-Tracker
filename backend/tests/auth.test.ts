import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import * as authService from '../src/services/auth.service';
import { ApiError } from '../src/utils/apiError';

jest.mock('../src/services/auth.service');

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      mockedAuthService.registerUser.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'mock-token',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('mock-token');
      expect(response.body.data.user.email).toBe('john@example.com');
    });

    it('returns 400 for invalid registration payload', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'J',
          email: 'not-an-email',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 409 when email already exists', async () => {
      mockedAuthService.registerUser.mockRejectedValue(
        new ApiError(409, 'An account with this email already exists'),
      );

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in a user successfully', async () => {
      mockedAuthService.loginUser.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'mock-token',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('mock-token');
    });

    it('returns 401 for invalid credentials', async () => {
      mockedAuthService.loginUser.mockRejectedValue(
        new ApiError(401, 'Invalid email or password'),
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('returns 400 for invalid login payload', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user when authenticated', async () => {
      mockedAuthService.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const token = jwt.sign(
        { userId: 'user-1', email: 'john@example.com', role: 'USER' },
        process.env.JWT_SECRET!,
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('john@example.com');
    });

    it('returns 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });
  });
});
