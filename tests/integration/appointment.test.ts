import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Category } from '../../src/app/modules/category/category.model';
import { Service } from '../../src/app/modules/service/service.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Chair } from '../../src/app/modules/chair/chair.model';
import { ChairRental } from '../../src/app/modules/chairRental/chairRental.model';
import { Appointment } from '../../src/app/modules/appointment/appointment.model';
import { Transaction } from '../../src/app/modules/transaction/transaction.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { RentalStatus } from '../../src/app/modules/chairRental/chairRental.constants';
import { AppointmentStatus } from '../../src/app/modules/appointment/appointment.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Appointment Module API Endpoints', () => {
  const customerUserData = {
    firstName: 'Sofia',
    lastName: 'Client',
    email: 'sofia.client@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const proUserData = {
    firstName: 'Dmitri',
    lastName: 'Master',
    email: 'dmitri.master@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const adminUserData = {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin.appointment@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Admin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const setupPrerequisites = async () => {
    const customer = await User.create(customerUserData);
    const professional = await User.create(proUserData);
    const admin = await User.create(adminUserData);

    const customerToken = createTestToken(
      UserRole.Customer,
      customer._id.toString(),
      customer.email,
    );
    const proToken = createTestToken(
      UserRole.Professional,
      professional._id.toString(),
      professional.email,
    );
    const adminToken = createTestToken(
      UserRole.Admin,
      admin._id.toString(),
      admin.email,
    );

    const salon = await Salon.create({
      name: 'Downtown Beauty Lab',
      businessType: 'Hair Salon',
      email: 'lab@cloudsalon.com',
      phone: '+1 555 432 1098',
      address: {
        line1: '100 Broadway',
        city: 'New York',
        state: 'NY',
        postalCode: '10005',
        country: 'USA',
      },
      location: {
        type: 'Point',
        coordinates: [-74.01, 40.71],
      },
      createdBy: professional._id,
    });

    const chair = await Chair.create({
      name: 'Station Deluxe 1',
      location: 'Main Hall',
      pricePerDayInUSD: 50,
      salon: salon._id,
    });

    // Create an active chair rental for the professional spanning 30 days
    const chairRental = await ChairRental.create({
      professional: professional._id,
      chair: chair._id,
      salon: salon._id,
      status: RentalStatus.Active,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days ahead
      durationInDays: 30,
      pricing: {
        total: 1500,
        currency: 'USD',
      },
    });

    const category = await Category.create({
      name: 'Master Haircuts',
      image: 'haircuts.png',
    });

    const service = await Service.create({
      name: 'Executive Fade & Beard',
      category: category._id,
      description: 'Full hair and beard treatment',
      priceInUSD: 70,
      durationInMinutes: 60,
      createdBy: professional._id,
    });

    return {
      customer,
      professional,
      admin,
      customerToken,
      proToken,
      adminToken,
      salon,
      chair,
      chairRental,
      service,
    };
  };

  describe('POST /api/v1/appointments/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/appointments/create')
        .send({});

      expect(res.status).toBe(401);
    });

    it('should return 403 when called by a Professional', async () => {
      const { proToken, professional, service } = await setupPrerequisites();
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/appointments/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          professional: professional._id.toString(),
          services: [service._id.toString()],
          startsAt: futureDate,
          pricing: { subtotal: 70, total: 70 },
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 when startsAt is in the past', async () => {
      const { customerToken, professional, service } = await setupPrerequisites();
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/appointments/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          professional: professional._id.toString(),
          services: [service._id.toString()],
          startsAt: pastDate,
          pricing: { subtotal: 70, total: 70 },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Appointment date must be in the future/i);
    });

    it('should return 400 when professional has no chair rental covering slot', async () => {
      const { customerToken, professional, service, chairRental } =
        await setupPrerequisites();

      // Delete chair rental to test slot availability
      await ChairRental.findByIdAndDelete(chairRental._id);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/appointments/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          professional: professional._id.toString(),
          services: [service._id.toString()],
          startsAt: futureDate,
          pricing: { subtotal: 70, total: 70 },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Professional is not available/i);
    });

    it('should create an appointment and return Stripe checkout session', async () => {
      const { customerToken, professional, customer, service } =
        await setupPrerequisites();
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/appointments/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          professional: professional._id.toString(),
          services: [service._id.toString()],
          startsAt: futureDate,
          pricing: { subtotal: 70, total: 70 },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Appointment created/i);
      expect(res.body.data).toHaveProperty('checkoutUrl');
      expect(res.body.data).toHaveProperty('sessionId');

      // Verify Appointment document created in database
      const createdApt = await Appointment.findOne({
        customer: customer._id,
        professional: professional._id,
      });
      expect(createdApt).toBeDefined();
      expect(createdApt?.status).toBe(AppointmentStatus.Pending);
      expect(createdApt?.pricing.total).toBe(70);

      // Verify transaction record created
      const txn = await Transaction.findOne({ user: customer._id });
      expect(txn).toBeDefined();
      expect(txn?.amount).toBe(70);
    });

    it('should return 409 conflict when booking overlapping time for the same professional', async () => {
      const { customerToken, professional, service } = await setupPrerequisites();
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      // First booking
      await request(app)
        .post('/api/v1/appointments/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          professional: professional._id.toString(),
          services: [service._id.toString()],
          startsAt: futureDate,
          pricing: { subtotal: 70, total: 70 },
        });

      // Second booking attempt with identical slot
      const res = await request(app)
        .post('/api/v1/appointments/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          professional: professional._id.toString(),
          services: [service._id.toString()],
          startsAt: futureDate,
          pricing: { subtotal: 70, total: 70 },
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Professional is already booked/i);
    });
  });

  describe('PATCH /api/v1/appointments/:id', () => {
    it('should return 404 when appointment does not exist', async () => {
      const { proToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ status: AppointmentStatus.Confirmed });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Appointment not found/i);
    });

    it('should update appointment status successfully', async () => {
      const {
        customerToken,
        proToken,
        professional,
        service,
        customer,
        salon,
        chair,
      } = await setupPrerequisites();

      const startsAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      const apt = await Appointment.create({
        customer: customer._id,
        professional: professional._id,
        salon: salon._id,
        chair: chair._id,
        services: [service._id],
        startsAt,
        endsAt,
        totalDurationInMinutes: 60,
        pricing: { subtotal: 70, discount: 0, total: 70, currency: 'USD' },
        status: AppointmentStatus.Pending,
      });

      const res = await request(app)
        .patch(`/api/v1/appointments/${apt._id}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ status: AppointmentStatus.Confirmed });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Appointment updated.');
      expect(res.body.data.status).toBe(AppointmentStatus.Confirmed);
    });
  });

  describe('GET /api/v1/appointments/single/:id', () => {
    it('should return 404 for non-existent appointment', async () => {
      const { customerToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/appointments/single/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Appointment not found/i);
    });

    it('should return appointment with populated relations', async () => {
      const { customerToken, customer, professional, salon, chair, service } =
        await setupPrerequisites();

      const startsAt = new Date(Date.now() + 80 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      const apt = await Appointment.create({
        customer: customer._id,
        professional: professional._id,
        salon: salon._id,
        chair: chair._id,
        services: [service._id],
        startsAt,
        endsAt,
        totalDurationInMinutes: 60,
        pricing: { subtotal: 70, discount: 0, total: 70, currency: 'USD' },
      });

      const res = await request(app)
        .get(`/api/v1/appointments/single/${apt._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Appointment fetched successfully');
      expect(res.body.data._id).toBe(apt._id.toString());
      expect(res.body.data.customer.email).toBe(customerUserData.email);
      expect(res.body.data.professional.email).toBe(proUserData.email);
      expect(res.body.data.salon.name).toBe('Downtown Beauty Lab');
    });
  });

  describe('GET /api/v1/appointments/me', () => {
    it('should return appointments for authenticated customer', async () => {
      const { customerToken, customer, professional, salon, chair, service } =
        await setupPrerequisites();

      const startsAt = new Date(Date.now() + 90 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      await Appointment.create({
        customer: customer._id,
        professional: professional._id,
        salon: salon._id,
        chair: chair._id,
        services: [service._id],
        startsAt,
        endsAt,
        totalDurationInMinutes: 60,
        pricing: { subtotal: 70, discount: 0, total: 70, currency: 'USD' },
      });

      const res = await request(app)
        .get('/api/v1/appointments/me?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Appointments fetched successfully');
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should return appointments for authenticated professional', async () => {
      const { proToken, customer, professional, salon, chair, service } =
        await setupPrerequisites();

      const startsAt = new Date(Date.now() + 100 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      await Appointment.create({
        customer: customer._id,
        professional: professional._id,
        salon: salon._id,
        chair: chair._id,
        services: [service._id],
        startsAt,
        endsAt,
        totalDurationInMinutes: 60,
        pricing: { subtotal: 70, discount: 0, total: 70, currency: 'USD' },
      });

      const res = await request(app)
        .get('/api/v1/appointments/me?page=1&limit=10')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/appointments', () => {
    it('should return 403 when called by non-admin', async () => {
      const { customerToken } = await setupPrerequisites();

      const res = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return all appointments when called by Admin', async () => {
      const { adminToken, customer, professional, salon, chair, service } =
        await setupPrerequisites();

      const startsAt = new Date(Date.now() + 110 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      await Appointment.create({
        customer: customer._id,
        professional: professional._id,
        salon: salon._id,
        chair: chair._id,
        services: [service._id],
        startsAt,
        endsAt,
        totalDurationInMinutes: 60,
        pricing: { subtotal: 70, discount: 0, total: 70, currency: 'USD' },
      });

      const res = await request(app)
        .get('/api/v1/appointments?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
