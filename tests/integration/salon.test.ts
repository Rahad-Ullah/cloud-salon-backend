import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { SalonStatus } from '../../src/app/modules/salon/salon.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Salon Module API Endpoints', () => {
  const proUserData = {
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const adminUserData = {
    firstName: 'Admin',
    lastName: 'Officer',
    email: 'admin.officer@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Admin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const sampleSalonPayload = {
    name: 'Luxe Hair & Beauty Studio',
    businessType: 'Hair Salon',
    description: 'Premier styling salon in downtown',
    email: 'contact@luxestudio.com',
    phone: '+1 234 567 8900',
    address: {
      line1: '456 Fifth Avenue',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-73.9851, 40.7488], // [lng, lat]
    },
  };

  describe('POST /api/v1/salons/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/salons/create')
        .send(sampleSalonPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 when called by a Customer', async () => {
      const customer = await User.create({
        ...proUserData,
        email: 'customer.trying.salon@cloudsalon.com',
        role: UserRole.Customer,
      });
      const customerToken = createTestToken(UserRole.Customer, customer._id.toString(), customer.email);

      const res = await request(app)
        .post('/api/v1/salons/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(sampleSalonPayload);

      expect(res.status).toBe(403);
    });

    it('should return 400 when required fields are missing in body', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      const res = await request(app)
        .post('/api/v1/salons/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ name: 'Incomplete Salon' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create salon successfully and mark user as isSalonOwner: true', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      const res = await request(app)
        .post('/api/v1/salons/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleSalonPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Salon created successfully');
      expect(res.body.data.name).toBe(sampleSalonPayload.name);

      // Verify in DB
      const createdSalon = await Salon.findOne({ createdBy: proUser._id });
      expect(createdSalon).toBeDefined();

      const updatedUser = await User.findById(proUser._id);
      expect(updatedUser?.isSalonOwner).toBe(true);
    });

    it('should return 409 if professional already created a salon', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      // First creation
      await request(app)
        .post('/api/v1/salons/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleSalonPayload);

      // Second creation attempt
      const res = await request(app)
        .post('/api/v1/salons/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleSalonPayload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Salon already exists for this user/i);
    });
  });

  describe('PATCH /api/v1/salons/:id', () => {
    it('should return 403 when updating a salon not owned by user', async () => {
      const owner = await User.create(proUserData);
      const anotherPro = await User.create({
        ...proUserData,
        email: 'another.pro@cloudsalon.com',
      });
      const anotherToken = createTestToken(UserRole.Professional, anotherPro._id.toString(), anotherPro.email);

      const salon = await Salon.create({
        ...sampleSalonPayload,
        createdBy: owner._id,
      });

      const res = await request(app)
        .patch(`/api/v1/salons/${salon._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not allowed to update this salon/i);
    });

    it('should update salon details when called by salon owner', async () => {
      const owner = await User.create(proUserData);
      const ownerToken = createTestToken(UserRole.Professional, owner._id.toString(), owner.email);

      const salon = await Salon.create({
        ...sampleSalonPayload,
        createdBy: owner._id,
      });

      const res = await request(app)
        .patch(`/api/v1/salons/${salon._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Updated Studio Name', description: 'New description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Studio Name');

      const updated = await Salon.findById(salon._id);
      expect(updated?.name).toBe('Updated Studio Name');
    });
  });

  describe('PATCH /api/v1/salons/:id/status', () => {
    it('should return 403 when professional attempts to change status', async () => {
      const owner = await User.create(proUserData);
      const ownerToken = createTestToken(UserRole.Professional, owner._id.toString(), owner.email);
      const salon = await Salon.create({ ...sampleSalonPayload, createdBy: owner._id });

      const res = await request(app)
        .patch(`/api/v1/salons/${salon._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: SalonStatus.Inactive });

      expect(res.status).toBe(403);
    });

    it('should allow Admin to update salon status', async () => {
      const owner = await User.create(proUserData);
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(UserRole.Admin, admin._id.toString(), admin.email);
      const salon = await Salon.create({ ...sampleSalonPayload, createdBy: owner._id });

      const res = await request(app)
        .patch(`/api/v1/salons/${salon._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: SalonStatus.Inactive });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SalonStatus.Inactive);

      const updated = await Salon.findById(salon._id);
      expect(updated?.status).toBe(SalonStatus.Inactive);
    });
  });

  describe('DELETE /api/v1/salons/:id', () => {
    it('should allow Admin to soft-delete salon', async () => {
      const owner = await User.create(proUserData);
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(UserRole.Admin, admin._id.toString(), admin.email);
      const salon = await Salon.create({ ...sampleSalonPayload, createdBy: owner._id });

      const res = await request(app)
        .delete(`/api/v1/salons/${salon._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Salon.findById(salon._id);
      expect(deleted?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/salons/my-salon', () => {
    it('should return 404 if user has no registered salon', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      const res = await request(app)
        .get('/api/v1/salons/my-salon')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Salon not found/i);
    });

    it('should return salon registered by authenticated professional', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      await Salon.create({ ...sampleSalonPayload, createdBy: proUser._id });

      const res = await request(app)
        .get('/api/v1/salons/my-salon')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(sampleSalonPayload.name);
    });
  });

  describe('GET /api/v1/salons/:id', () => {
    it('should return salon by id publicly without auth', async () => {
      const proUser = await User.create(proUserData);
      const salon = await Salon.create({ ...sampleSalonPayload, createdBy: proUser._id });

      const res = await request(app).get(`/api/v1/salons/${salon._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(salon._id.toString());
      expect(res.body.data.createdBy).toBeDefined();
    });

    it('should return 404 for non-existent salon id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/salons/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/salons', () => {
    it('should list all active salons with pagination', async () => {
      const proUser = await User.create(proUserData);
      await Salon.create({ ...sampleSalonPayload, createdBy: proUser._id });

      const res = await request(app)
        .get('/api/v1/salons')
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter salons by city', async () => {
      const proUser = await User.create(proUserData);
      await Salon.create({ ...sampleSalonPayload, createdBy: proUser._id });

      const res = await request(app)
        .get('/api/v1/salons')
        .query({ city: 'New York' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].address.city).toBe('New York');
    });
  });
});
