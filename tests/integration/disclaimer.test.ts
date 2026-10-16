import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { Disclaimer } from '../../src/app/modules/disclaimer/disclaimer.model';
import { DisclaimerType } from '../../src/app/modules/disclaimer/disclaimer.constants';
import { UserRole } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Disclaimer Module API Endpoints', () => {
  const adminToken = createTestToken(
    UserRole.Admin,
    new mongoose.Types.ObjectId().toString(),
    'admin.disclaimer@cloudsalon.com',
  );
  const customerToken = createTestToken(
    UserRole.Customer,
    new mongoose.Types.ObjectId().toString(),
    'customer.disclaimer@cloudsalon.com',
  );

  describe('POST /api/v1/disclaimers', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/disclaimers')
        .send({
          type: DisclaimerType.TermsOfService,
          content: 'Terms of service content...',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 when accessed by Customer', async () => {
      const res = await request(app)
        .post('/api/v1/disclaimers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          type: DisclaimerType.TermsOfService,
          content: 'Terms of service content...',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 when type is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/disclaimers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'invalid_type',
          content: 'Content...',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create disclaimer when accessed by Admin', async () => {
      const res = await request(app)
        .post('/api/v1/disclaimers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: DisclaimerType.TermsOfService,
          content: 'Welcome to Cloud Salon Terms of Service.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Disclaimer updated successfully');
      expect(res.body.data.type).toBe(DisclaimerType.TermsOfService);
      expect(res.body.data.content).toBe('Welcome to Cloud Salon Terms of Service.');
    });

    it('should update existing disclaimer when called with existing type', async () => {
      await Disclaimer.create({
        type: DisclaimerType.PrivacyPolicy,
        content: 'Original Privacy Policy',
      });

      const res = await request(app)
        .post('/api/v1/disclaimers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: DisclaimerType.PrivacyPolicy,
          content: 'Updated Privacy Policy v2',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Updated Privacy Policy v2');

      const count = await Disclaimer.countDocuments({
        type: DisclaimerType.PrivacyPolicy,
      });
      expect(count).toBe(1);
    });
  });

  describe('GET /api/v1/disclaimers/:type', () => {
    it('should return 400 when type parameter is invalid', async () => {
      const res = await request(app).get('/api/v1/disclaimers/unknown_type');

      expect(res.status).toBe(400);
    });

    it('should return null data when disclaimer is not found', async () => {
      const res = await request(app).get(
        `/api/v1/disclaimers/${DisclaimerType.AboutUs}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('should fetch disclaimer by type publicly', async () => {
      await Disclaimer.create({
        type: DisclaimerType.AboutUs,
        content: 'About Cloud Salon platform...',
      });

      const res = await request(app).get(
        `/api/v1/disclaimers/${DisclaimerType.AboutUs}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Disclaimer fetched successfully');
      expect(res.body.data.type).toBe(DisclaimerType.AboutUs);
      expect(res.body.data.content).toBe('About Cloud Salon platform...');
    });
  });
});
