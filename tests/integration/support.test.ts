import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { Support } from '../../src/app/modules/support/support.model';
import { User } from '../../src/app/modules/user/user.model';
import { SupportStatus, SupportType } from '../../src/app/modules/support/support.constants';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Support Module API Endpoints', () => {
  const customerData = {
    firstName: 'Support',
    lastName: 'Customer',
    email: 'cust.support@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const adminToken = createTestToken(
    UserRole.Admin,
    new mongoose.Types.ObjectId().toString(),
    'admin.support@cloudsalon.com',
  );

  describe('POST /api/v1/supports/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/supports/create')
        .send({
          type: SupportType.GeneralInquiry,
          title: 'Question about opening hours',
          message: 'Can you please tell me if salons are open on weekends?',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 when message is too short (< 10 chars)', async () => {
      const user = await User.create(customerData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .post('/api/v1/supports/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: SupportType.GeneralInquiry,
          title: 'Question',
          message: 'Short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create support ticket successfully for Customer', async () => {
      const user = await User.create(customerData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .post('/api/v1/supports/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: SupportType.TechnicalSupport,
          title: 'App crashing on booking screen',
          message: 'Whenever I try to confirm appointment, the app freezes.',
          phone: '+1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Support ticket created successfully');
      expect(res.body.data.user).toBe(user._id.toString());
      expect(res.body.data.status).toBe(SupportStatus.Open);
      expect(res.body.data.title).toBe('App crashing on booking screen');
    });
  });

  describe('PATCH /api/v1/supports/:id', () => {
    it('should return 403 when Customer tries to update ticket status', async () => {
      const user = await User.create(customerData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const ticket = await Support.create({
        user: user._id,
        type: SupportType.GeneralInquiry,
        title: 'Inquiry',
        message: 'This is a test support message with enough length.',
      });

      const res = await request(app)
        .patch(`/api/v1/supports/${ticket._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: SupportStatus.Resolved });

      expect(res.status).toBe(403);
    });

    it('should return 404 when support ticket not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/supports/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: SupportStatus.Resolved });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Support ticket not found/i);
    });

    it('should update ticket status successfully by Admin', async () => {
      const user = await User.create(customerData);

      const ticket = await Support.create({
        user: user._id,
        type: SupportType.BillingSupport,
        title: 'Billing double charge',
        message: 'I was charged twice for my haircut booking.',
      });

      const res = await request(app)
        .patch(`/api/v1/supports/${ticket._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: SupportStatus.Resolved });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Support ticket updated successfully');
      expect(res.body.data.status).toBe(SupportStatus.Resolved);
    });
  });

  describe('GET /api/v1/supports/single/:id', () => {
    it('should return 404 when ticket not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/supports/single/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should fetch single support ticket with user populated', async () => {
      const user = await User.create(customerData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const ticket = await Support.create({
        user: user._id,
        type: SupportType.SafetyPrivacy,
        title: 'Privacy inquiry',
        message: 'How is my private data encrypted and stored?',
      });

      const res = await request(app)
        .get(`/api/v1/supports/single/${ticket._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Support ticket fetched successfully');
      expect(res.body.data._id).toBe(ticket._id.toString());
      expect(res.body.data.user._id).toBe(user._id.toString());
      expect(res.body.data.user.email).toBe(user.email);
    });
  });

  describe('GET /api/v1/supports/me', () => {
    it('should return user specific support tickets', async () => {
      const user1 = await User.create(customerData);
      const user2 = await User.create({
        firstName: 'Other',
        lastName: 'Customer',
        email: 'other.cust@cloudsalon.com',
        password: 'Password123!',
        role: UserRole.Customer,
        isEmailVerified: true,
        status: UserStatus.Active,
      });

      const token1 = createTestToken(UserRole.Customer, user1._id.toString(), user1.email);

      await Support.create([
        {
          user: user1._id,
          type: SupportType.GeneralInquiry,
          title: 'Ticket 1',
          message: 'First test support ticket for user 1.',
        },
        {
          user: user1._id,
          type: SupportType.TechnicalSupport,
          title: 'Ticket 2',
          message: 'Second test support ticket for user 1.',
        },
        {
          user: user2._id,
          type: SupportType.BillingSupport,
          title: 'Ticket 3',
          message: 'Test support ticket belonging to user 2.',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/supports/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Support tickets fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/supports', () => {
    it('should return 403 when accessed by Customer', async () => {
      const user = await User.create(customerData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const res = await request(app)
        .get('/api/v1/supports')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return all support tickets when accessed by Admin', async () => {
      const user = await User.create(customerData);

      await Support.create([
        {
          user: user._id,
          type: SupportType.GeneralInquiry,
          title: 'Ticket A',
          message: 'Message A for admin listing check.',
        },
        {
          user: user._id,
          type: SupportType.BillingSupport,
          title: 'Ticket B',
          message: 'Message B for admin listing check.',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/supports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Support tickets fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });
});
