import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Auth Module API Endpoints', () => {
  const testUserData = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Seed an active, verified customer user for login tests
      await User.create(testUserData);
    });

    it('should return 400 when request body fails Zod validation (missing password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@cloudsalon.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorMessages).toBeDefined();
    });

    it('should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@cloudsalon.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/doesn't exist|Invalid email/i);
    });

    it('should return 400 when password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/incorrect|Invalid email/i);
    });

    it('should return 407 if email is not verified', async () => {
      await User.updateOne(
        { email: testUserData.email },
        { isEmailVerified: false }
      );

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });

      expect(res.status).toBe(407);
      expect(res.body.message).toMatch(/verify your account/i);
    });

    it('should log in successfully and return JWT tokens for valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User logged in successfully.');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('role', UserRole.Customer);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    let createdUser: any;
    let customerToken: string;

    beforeEach(async () => {
      createdUser = await User.create(testUserData);
      customerToken = createTestToken(
        UserRole.Customer,
        createdUser._id.toString(),
        createdUser.email
      );
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully change password when authenticated with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Your password has been successfully changed');

      // Verify new password can now be used to log in
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: 'NewPassword456!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });
  });
});
