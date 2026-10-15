import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Chair } from '../../src/app/modules/chair/chair.model';
import { ChairRental } from '../../src/app/modules/chairRental/chairRental.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { ChairStatus } from '../../src/app/modules/chair/chair.constants';
import { RentalStatus } from '../../src/app/modules/chairRental/chairRental.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Chair Rental Module API Endpoints', () => {
  const salonOwnerData = {
    firstName: 'Sal',
    lastName: 'Owner',
    email: 'sal.owner@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const renterProData = {
    firstName: 'Rita',
    lastName: 'Renter',
    email: 'rita.renter@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const adminData = {
    firstName: 'Auditor',
    lastName: 'Admin',
    email: 'auditor.admin@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Admin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const sampleSalonData = {
    name: 'Metropolitan Salon',
    businessType: 'Hair & Beauty',
    email: 'metropolitan@cloudsalon.com',
    phone: '+1 234 567 8902',
    address: {
      line1: '789 Sixth Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10003',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-73.98, 40.76],
    },
  };

  const getFutureDates = (startDaysFromNow: number, endDaysFromNow: number) => {
    const start = new Date(Date.now() + startDaysFromNow * 86_400_000);
    const end = new Date(Date.now() + endDaysFromNow * 86_400_000);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  describe('POST /api/v1/chair-rentals/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const dates = getFutureDates(2, 5);
      const res = await request(app)
        .post('/api/v1/chair-rentals/create')
        .send({
          chair: new mongoose.Types.ObjectId().toString(),
          ...dates,
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 when start date is not in future or end date is before start date', async () => {
      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);

      const pastStart = new Date(Date.now() - 86_400_000).toISOString();
      const futureEnd = new Date(Date.now() + 86_400_000).toISOString();

      const res = await request(app)
        .post('/api/v1/chair-rentals/create')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          chair: new mongoose.Types.ObjectId().toString(),
          startDate: pastStart,
          endDate: futureEnd,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when target chair is not found', async () => {
      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);
      const nonExistentChairId = new mongoose.Types.ObjectId().toString();
      const dates = getFutureDates(2, 5);

      const res = await request(app)
        .post('/api/v1/chair-rentals/create')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          chair: nonExistentChairId,
          ...dates,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chair not found/i);
    });

    it('should create a chair rental and return stripe checkout session', async () => {
      const owner = await User.create(salonOwnerData);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: owner._id });
      const chair = await Chair.create({
        name: 'Station 10',
        salon: salon._id,
        pricePerDayInUSD: 40,
        location: 'Section 1',
        status: ChairStatus.Active,
      });

      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);
      const dates = getFutureDates(3, 7);

      const res = await request(app)
        .post('/api/v1/chair-rentals/create')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          chair: chair._id.toString(),
          ...dates,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('ChairRental created successfully');
      expect(res.body.data).toHaveProperty('checkoutUrl');
      expect(res.body.data).toHaveProperty('sessionId');

      // Verify rental was created in DB
      const rental = await ChairRental.findOne({ chair: chair._id, professional: renter._id });
      expect(rental).toBeDefined();
      expect(rental?.status).toBe(RentalStatus.Pending);
      expect(rental?.pricing.total).toBe(4 * 40); // 4 days * $40
    });

    it('should return 409 conflict when booking overlapping rental dates for the same chair', async () => {
      const owner = await User.create(salonOwnerData);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: owner._id });
      const chair = await Chair.create({
        name: 'Station 10',
        salon: salon._id,
        pricePerDayInUSD: 40,
        location: 'Section 1',
        status: ChairStatus.Active,
      });

      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);

      // Seed existing confirmed rental for days 4-8
      const existingDates = getFutureDates(4, 8);
      await ChairRental.create({
        chair: chair._id,
        salon: salon._id,
        professional: renter._id,
        startDate: new Date(existingDates.startDate),
        endDate: new Date(existingDates.endDate),
        durationInDays: 4,
        status: RentalStatus.Confirmed,
        pricing: { total: 160 },
      });

      // Try booking overlapping days 5-10
      const overlappingDates = getFutureDates(5, 10);
      const res = await request(app)
        .post('/api/v1/chair-rentals/create')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          chair: chair._id.toString(),
          ...overlappingDates,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Chair is not available during this period/i);
    });
  });

  describe('PATCH /api/v1/chair-rentals/:id', () => {
    it('should update rental status successfully', async () => {
      const owner = await User.create(salonOwnerData);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: owner._id });
      const chair = await Chair.create({
        name: 'Station 10',
        salon: salon._id,
        pricePerDayInUSD: 40,
        location: 'Section 1',
      });

      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);
      const dates = getFutureDates(3, 6);

      const rental = await ChairRental.create({
        chair: chair._id,
        salon: salon._id,
        professional: renter._id,
        startDate: new Date(dates.startDate),
        endDate: new Date(dates.endDate),
        durationInDays: 3,
        status: RentalStatus.Pending,
        pricing: { total: 120 },
      });

      const res = await request(app)
        .patch(`/api/v1/chair-rentals/${rental._id}`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ status: RentalStatus.Confirmed });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(RentalStatus.Confirmed);

      const updated = await ChairRental.findById(rental._id);
      expect(updated?.status).toBe(RentalStatus.Confirmed);
    });
  });

  describe('GET /api/v1/chair-rentals/single/:id', () => {
    it('should return single chair rental by id', async () => {
      const owner = await User.create(salonOwnerData);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: owner._id });
      const chair = await Chair.create({
        name: 'Station 10',
        salon: salon._id,
        pricePerDayInUSD: 40,
        location: 'Section 1',
      });

      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);
      const dates = getFutureDates(3, 6);

      const rental = await ChairRental.create({
        chair: chair._id,
        salon: salon._id,
        professional: renter._id,
        startDate: new Date(dates.startDate),
        endDate: new Date(dates.endDate),
        durationInDays: 3,
        status: RentalStatus.Confirmed,
        pricing: { total: 120 },
      });

      const res = await request(app)
        .get(`/api/v1/chair-rentals/single/${rental._id}`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(rental._id.toString());
      expect(res.body.data.chair).toBeDefined();
    });
  });

  describe('GET /api/v1/chair-rentals/my-rentals', () => {
    it('should return paginated list of rentals booked by authenticated professional', async () => {
      const owner = await User.create(salonOwnerData);
      const salon = await Salon.create({ ...sampleSalonData, createdBy: owner._id });
      const chair = await Chair.create({
        name: 'Station 10',
        salon: salon._id,
        pricePerDayInUSD: 40,
        location: 'Section 1',
      });

      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);
      const dates = getFutureDates(5, 9);

      await ChairRental.create({
        chair: chair._id,
        salon: salon._id,
        professional: renter._id,
        startDate: new Date(dates.startDate),
        endDate: new Date(dates.endDate),
        durationInDays: 4,
        status: RentalStatus.Confirmed,
        pricing: { total: 160 },
      });

      const res = await request(app)
        .get('/api/v1/chair-rentals/my-rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/chair-rentals', () => {
    it('should return 403 when called by non-admin', async () => {
      const renter = await User.create(renterProData);
      const renterToken = createTestToken(UserRole.Professional, renter._id.toString(), renter.email);

      const res = await request(app)
        .get('/api/v1/chair-rentals')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(res.status).toBe(403);
    });

    it('should return all rentals with pagination when called by Admin', async () => {
      const admin = await User.create(adminData);
      const adminToken = createTestToken(UserRole.Admin, admin._id.toString(), admin.email);

      const res = await request(app)
        .get('/api/v1/chair-rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
