import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Chair } from '../../src/app/modules/chair/chair.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Chair Module API Endpoints', () => {
  const proUserData = {
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const sampleSalonData = {
    name: 'Vance Barber & Styling',
    businessType: 'Barbershop',
    email: 'contact@vancebarber.com',
    phone: '+1 234 567 8901',
    address: {
      line1: '100 Broadway',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-73.99, 40.75],
    },
  };

  const sampleChairPayload = {
    name: 'Vintage Station 1',
    description: 'Ergonomic leather chair with hydraulic lift',
    location: 'Main Salon Floor - Section A',
    pricePerDayInUSD: 50,
  };

  describe('POST /api/v1/chairs/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/chairs/create')
        .send(sampleChairPayload);

      expect(res.status).toBe(401);
    });

    it('should return 404 if professional does not have a salon', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      const res = await request(app)
        .post('/api/v1/chairs/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleChairPayload);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Salon not found/i);
    });

    it('should return 400 when required fields are missing', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      await Salon.create({ ...sampleSalonData, createdBy: proUser._id });

      const res = await request(app)
        .post('/api/v1/chairs/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create a chair successfully under the professional salon', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: proUser._id });

      const res = await request(app)
        .post('/api/v1/chairs/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleChairPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Chair created successfully');
      expect(res.body.data.name).toBe(sampleChairPayload.name);
      expect(res.body.data.salon).toBe(salon._id.toString());

      // Verify in DB
      const created = await Chair.findOne({ name: sampleChairPayload.name, salon: salon._id });
      expect(created).toBeDefined();
    });

    it('should return 409 when creating a chair with duplicate name in the same salon', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      await Salon.create({ ...sampleSalonData, createdBy: proUser._id });

      // First chair
      await request(app)
        .post('/api/v1/chairs/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleChairPayload);

      // Duplicate chair
      const res = await request(app)
        .post('/api/v1/chairs/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleChairPayload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Chair already exists/i);
    });
  });

  describe('PATCH /api/v1/chairs/:id', () => {
    it('should return 404 when chair not found', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/chairs/${fakeId}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ pricePerDayInUSD: 60 });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chair not found/i);
    });

    it('should update chair details successfully', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: proUser._id });

      const chair = await Chair.create({
        ...sampleChairPayload,
        salon: salon._id,
      });

      const res = await request(app)
        .patch(`/api/v1/chairs/${chair._id}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ pricePerDayInUSD: 65, name: 'Renovated Station 1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pricePerDayInUSD).toBe(65);
      expect(res.body.data.name).toBe('Renovated Station 1');

      const updated = await Chair.findById(chair._id);
      expect(updated?.pricePerDayInUSD).toBe(65);
    });
  });

  describe('DELETE /api/v1/chairs/:id', () => {
    it('should soft delete chair', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: proUser._id });
      const chair = await Chair.create({ ...sampleChairPayload, salon: salon._id });

      const res = await request(app)
        .delete(`/api/v1/chairs/${chair._id}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Chair.findById(chair._id);
      expect(deleted?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/chairs/single/:id', () => {
    it('should return chair details with populated salon for authenticated user', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: proUser._id });
      const chair = await Chair.create({ ...sampleChairPayload, salon: salon._id });

      const res = await request(app)
        .get(`/api/v1/chairs/single/${chair._id}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(chair._id.toString());
      expect(res.body.data.salon).toBeDefined();
    });
  });

  describe('GET /api/v1/chairs/my-chairs', () => {
    it('should list all chairs belonging to professional salon', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: proUser._id });

      await Chair.create([
        { ...sampleChairPayload, name: 'Chair A', salon: salon._id },
        { ...sampleChairPayload, name: 'Chair B', salon: salon._id },
      ]);

      const res = await request(app)
        .get('/api/v1/chairs/my-chairs')
        .set('Authorization', `Bearer ${proToken}`)
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/v1/chairs', () => {
    it('should reject Customer role with 403', async () => {
      const customer = await User.create({
        ...proUserData,
        email: 'customer.browsing.chairs@cloudsalon.com',
        role: UserRole.Customer,
      });
      const customerToken = createTestToken(UserRole.Customer, customer._id.toString(), customer.email);

      const res = await request(app)
        .get('/api/v1/chairs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should list all chairs for Professional or Admin', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: proUser._id });
      await Chair.create({ ...sampleChairPayload, salon: salon._id });

      const res = await request(app)
        .get('/api/v1/chairs')
        .set('Authorization', `Bearer ${proToken}`)
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
