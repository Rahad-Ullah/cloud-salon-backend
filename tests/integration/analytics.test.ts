import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Appointment } from '../../src/app/modules/appointment/appointment.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Review } from '../../src/app/modules/review/review.model';
import { Wishlist } from '../../src/app/modules/wishlist/wishlist.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { PaymentStatus, AppointmentStatus } from '../../src/app/modules/appointment/appointment.constants';
import { EntityType } from '../../src/app/modules/review/review.constants';
import { WishlistEntityType } from '../../src/app/modules/wishlist/wishlist.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Analytics Module API Endpoints', () => {
  const customerData = {
    firstName: 'Analytics',
    lastName: 'Customer',
    email: 'cust.analytics@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const professionalData = {
    firstName: 'Analytics',
    lastName: 'Professional',
    email: 'pro.analytics@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const adminToken = createTestToken(
    UserRole.Admin,
    new mongoose.Types.ObjectId().toString(),
    'admin.analytics@cloudsalon.com',
  );

  describe('GET /api/v1/analytics/overview/customer', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/analytics/overview/customer');

      expect(res.status).toBe(401);
    });

    it('should return 403 when called by a Professional', async () => {
      const pro = await User.create(professionalData);
      const proToken = createTestToken(UserRole.Professional, pro._id.toString(), pro.email);

      const res = await request(app)
        .get('/api/v1/analytics/overview/customer')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(403);
    });

    it('should return customer metrics for authenticated customer', async () => {
      const customer = await User.create(customerData);
      const pro = await User.create(professionalData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      // Create an appointment for customer
      await Appointment.create({
        customer: customer._id,
        professional: pro._id,
        chair: new mongoose.Types.ObjectId(),
        salon: new mongoose.Types.ObjectId(),
        services: [new mongoose.Types.ObjectId()],
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
        totalDurationInMinutes: 60,
        pricing: { subtotal: 50, discount: 0, total: 50, currency: 'USD' },
        status: AppointmentStatus.Confirmed,
        paymentStatus: PaymentStatus.Paid,
      });

      // Create a wishlist item
      await Wishlist.create({
        user: customer._id,
        entityType: WishlistEntityType.Salon,
        entity: new mongoose.Types.ObjectId(),
      });

      const res = await request(app)
        .get('/api/v1/analytics/overview/customer')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Customer overview fetched successfully');
      expect(res.body.data.totalAppointments).toBe(1);
      expect(res.body.data.totalUpcomingAppointments).toBe(1);
      expect(res.body.data.totalWishlists).toBe(1);
    });
  });

  describe('GET /api/v1/analytics/overview/professional', () => {
    it('should return 403 when called by Customer', async () => {
      const customer = await User.create(customerData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      const res = await request(app)
        .get('/api/v1/analytics/overview/professional')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return professional metrics for authenticated professional', async () => {
      const customer = await User.create(customerData);
      const pro = await User.create(professionalData);
      const proToken = createTestToken(
        UserRole.Professional,
        pro._id.toString(),
        pro.email,
      );

      // Create a review for the professional
      await Review.create({
        user: customer._id,
        entity: pro._id,
        entityType: EntityType.User,
        rating: 5,
        comment: 'Exceptional stylist!',
      });

      const res = await request(app)
        .get('/api/v1/analytics/overview/professional')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Professional overview fetched successfully');
      expect(res.body.data.totalReviews).toBe(1);
      expect(Array.isArray(res.body.data.monthlyAppointmentsGrowth)).toBe(true);
      expect(res.body.data.monthlyAppointmentsGrowth.length).toBe(12);
    });
  });

  describe('GET /api/v1/analytics/overview/admin', () => {
    it('should return 403 when called by non-admin', async () => {
      const customer = await User.create(customerData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      const res = await request(app)
        .get('/api/v1/analytics/overview/admin')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return overall platform stats for Admin', async () => {
      await User.create(customerData);
      await User.create(professionalData);
      await Salon.create({
        name: 'Analytics Salon',
        businessType: 'Hair Salon',
        email: 'salon@cloudsalon.com',
        phone: '+1 555 432 1098',
        address: {
          line1: '100 Broadway',
          city: 'New York',
          state: 'NY',
          postalCode: '10005',
          country: 'USA',
        },
        location: { type: 'Point', coordinates: [0, 0] },
        createdBy: new mongoose.Types.ObjectId(),
      });

      const res = await request(app)
        .get('/api/v1/analytics/overview/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin overview fetched successfully');
      expect(res.body.data.totalCustomers).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalProfessionals).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalSalons).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/analytics/users-growth', () => {
    it('should return 403 when called by non-admin', async () => {
      const customer = await User.create(customerData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      const res = await request(app)
        .get('/api/v1/analytics/users-growth')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 12-month user growth series for Admin', async () => {
      await User.create(customerData);
      await User.create(professionalData);

      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .get(`/api/v1/analytics/users-growth?year=${currentYear}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User growth fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(12);

      const totalCount = res.body.data.reduce(
        (acc: number, curr: { count: number }) => acc + curr.count,
        0,
      );
      expect(totalCount).toBeGreaterThanOrEqual(2);
    });
  });
});
