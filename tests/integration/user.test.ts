import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { Professional } from '../../src/app/modules/professional/professional.model';
import { createTestToken } from '../helpers/auth.helper';

describe('User Module API Endpoints', () => {
  const customerUserData = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const adminUserData = {
    firstName: 'Admin',
    lastName: 'Chief',
    email: 'admin.chief@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Admin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/users/register', () => {
    it('should return 400 when request body is missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ email: 'missing.fields@cloudsalon.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorMessages).toBeDefined();
    });

    it('should return 400 when email already exists', async () => {
      await User.create(customerUserData);

      const res = await request(app)
        .post('/api/v1/users/register')
        .send({
          firstName: 'Another',
          lastName: 'User',
          role: UserRole.Customer,
          email: customerUserData.email,
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Email already exists/i);
    });

    it('should register a new customer successfully and create authentication OTP', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({
          firstName: 'Charlie',
          lastName: 'Brown',
          role: UserRole.Customer,
          email: 'charlie.brown@cloudsalon.com',
          password: 'Password123!',
          phone: { countryCode: '+1', number: '5551234567' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Account created successfully/i);

      // Verify user in database
      const created = await User.findOne({ email: 'charlie.brown@cloudsalon.com' }).select('+authentication');
      expect(created).toBeDefined();
      expect(created?.role).toBe(UserRole.Customer);
      expect(created?.authentication?.oneTimeCode).toBeDefined();
    });

    it('should register a professional user and automatically create linked Professional profile', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({
          firstName: 'Stylist',
          lastName: 'Pro',
          role: UserRole.Professional,
          email: 'stylist.pro@cloudsalon.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const createdUser = await User.findOne({ email: 'stylist.pro@cloudsalon.com' });
      expect(createdUser).toBeDefined();
      expect(createdUser?.role).toBe(UserRole.Professional);
      expect(createdUser?.roleRef).toBeDefined();

      const professionalDoc = await Professional.findOne({ user: createdUser?._id });
      expect(professionalDoc).toBeDefined();
      expect(createdUser?.roleRef?.toString()).toBe(professionalDoc?._id.toString());
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return profile for authenticated user', async () => {
      const user = await User.create(customerUserData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(customerUserData.email);
      expect(res.body.data.firstName).toBe(customerUserData.firstName);
    });

    it('should return 400 if user account is marked deleted', async () => {
      const user = await User.create({ ...customerUserData, isDeleted: true });
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/deleted or deactivated/i);
    });

    it('should return 400 if user account is banned or inactive', async () => {
      const user = await User.create({ ...customerUserData, status: UserStatus.Banned });
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/suspended or deactivated/i);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .send({ firstName: 'Updated' });

      expect(res.status).toBe(401);
    });

    it('should update profile fields successfully', async () => {
      const user = await User.create(customerUserData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Alicia',
          lastName: 'Updated',
          phone: { countryCode: '+1', number: '9876543210' },
          address: {
            line1: '123 Salon Blvd',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            postalCode: '10001',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Alicia');
      expect(res.body.data.address.city).toBe('New York');

      // Verify in DB
      const updated = await User.findById(user._id);
      expect(updated?.firstName).toBe('Alicia');
      expect(updated?.address?.city).toBe('New York');
    });
  });

  describe('GET /api/v1/users/single/:id', () => {
    it('should return 400 for invalid object id format', async () => {
      const user = await User.create(customerUserData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get('/api/v1/users/single/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return user details by id', async () => {
      const user = await User.create(customerUserData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get(`/api/v1/users/single/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(user._id.toString());
    });
  });

  describe('PATCH /api/v1/users/:id/status', () => {
    it('should return 403 when customer tries to update another user status', async () => {
      const targetUser = await User.create(customerUserData);
      const normalToken = createTestToken(UserRole.Customer, targetUser._id.toString(), targetUser.email);

      const res = await request(app)
        .patch(`/api/v1/users/${targetUser._id}/status`)
        .set('Authorization', `Bearer ${normalToken}`)
        .send({ status: UserStatus.Banned });

      expect(res.status).toBe(403);
    });

    it('should allow Admin to update user status', async () => {
      const targetUser = await User.create(customerUserData);
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(UserRole.Admin, admin._id.toString(), admin.email);

      const res = await request(app)
        .patch(`/api/v1/users/${targetUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: UserStatus.Banned });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(UserStatus.Banned);

      const updated = await User.findById(targetUser._id);
      expect(updated?.status).toBe(UserStatus.Banned);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should return 403 when non-admin tries to delete user', async () => {
      const targetUser = await User.create(customerUserData);
      const customerToken = createTestToken(UserRole.Customer, targetUser._id.toString(), targetUser.email);

      const res = await request(app)
        .delete(`/api/v1/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should soft delete user when executed by Admin', async () => {
      const targetUser = await User.create(customerUserData);
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(UserRole.Admin, admin._id.toString(), admin.email);

      const res = await request(app)
        .delete(`/api/v1/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await User.findById(targetUser._id);
      expect(deleted?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/users/all', () => {
    it('should return 403 when customer tries to list all users', async () => {
      const user = await User.create(customerUserData);
      const customerToken = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return paginated users list for Admin', async () => {
      await User.create(customerUserData);
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(UserRole.Admin, admin._id.toString(), admin.email);

      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('total');
    });
  });
});
