import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Professional } from '../../src/app/modules/professional/professional.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Professional Module API Endpoints', () => {
  const proUserData = {
    firstName: 'Sarah',
    lastName: 'Stylist',
    email: 'sarah.stylist@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const customerUserData = {
    firstName: 'Bob',
    lastName: 'Customer',
    email: 'bob.customer@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('PATCH /api/v1/professionals/me', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/professionals/me')
        .send({ title: 'Master Stylist' });

      expect(res.status).toBe(401);
    });

    it('should return 403 when authenticated as Customer', async () => {
      const customer = await User.create(customerUserData);
      const customerToken = createTestToken(UserRole.Customer, customer._id.toString(), customer.email);

      const res = await request(app)
        .patch('/api/v1/professionals/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ title: 'Master Stylist' });

      expect(res.status).toBe(403);
    });

    it('should return 400 when body fails Zod schema validation (negative experience)', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      const res = await request(app)
        .patch('/api/v1/professionals/me')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ experienceYears: -5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorMessages).toBeDefined();
    });

    it('should return 404 if professional profile document does not exist for the user', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      const res = await request(app)
        .patch('/api/v1/professionals/me')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ title: 'Lead Barber' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Professional not found/i);
    });

    it('should update professional profile fields successfully for authenticated professional', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(UserRole.Professional, proUser._id.toString(), proUser.email);

      // Create initial professional document linked to proUser
      const initialPro = await Professional.create({
        user: proUser._id,
        title: 'Junior Stylist',
        experienceYears: 1,
      });

      await User.findByIdAndUpdate(proUser._id, { roleRef: initialPro._id });

      const res = await request(app)
        .patch('/api/v1/professionals/me')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          title: 'Senior Colorist & Stylist',
          quote: 'Bringing vibrancy to your hair.',
          bio: 'Specializing in balayage and precision cuts for over 6 years.',
          experienceYears: 6,
          startingPriceInUSD: 60,
          specialties: ['Balayage', 'Hair Treatment', 'Keratin'],
          photos: ['https://cloudsalon.com/photo1.jpg'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Professional updated successfully');
      expect(res.body.data.title).toBe('Senior Colorist & Stylist');
      expect(res.body.data.experienceYears).toBe(6);
      expect(res.body.data.startingPriceInUSD).toBe(60);

      // Verify in DB
      const updated = await Professional.findOne({ user: proUser._id });
      expect(updated?.title).toBe('Senior Colorist & Stylist');
      expect(updated?.specialties).toContain('Balayage');
      expect(updated?.photos).toContain('https://cloudsalon.com/photo1.jpg');
    });
  });

  describe('GET /api/v1/professionals/active', () => {
    it('should allow public access and return active professionals response structure', async () => {
      const res = await request(app)
        .get('/api/v1/professionals/active')
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Professional fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should return 400 for invalid query parameter object id', async () => {
      const res = await request(app)
        .get('/api/v1/professionals/active')
        .query({ salon: 'invalid-id-format' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
