import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { Setting } from '../../src/app/modules/setting/setting.model';
import { UserRole } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Setting Module API Endpoints', () => {
  const adminToken = createTestToken(
    UserRole.Admin,
    new mongoose.Types.ObjectId().toString(),
    'admin.setting@cloudsalon.com',
  );
  const customerToken = createTestToken(
    UserRole.Customer,
    new mongoose.Types.ObjectId().toString(),
    'customer.setting@cloudsalon.com',
  );

  describe('POST /api/v1/settings', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/settings')
        .send({
          platformFeePercentage: 10,
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 when accessed by Customer', async () => {
      const res = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          platformFeePercentage: 10,
        });

      expect(res.status).toBe(403);
    });

    it('should create or update settings when accessed by Admin', async () => {
      const res = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformFeePercentage: 12.5,
          contactInfo: {
            email: 'support@cloudsalon.com',
            address: '100 Salon Way, New York, NY',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Setting updated successfully');
      expect(res.body.data.platformFeePercentage).toBe(12.5);
      expect(res.body.data.contactInfo.email).toBe('support@cloudsalon.com');
      expect(res.body.data.contactInfo.address).toBe('100 Salon Way, New York, NY');
    });

    it('should maintain a single setting document when updated multiple times', async () => {
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformFeePercentage: 8,
        });

      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformFeePercentage: 15,
        });

      const count = await Setting.countDocuments();
      expect(count).toBe(1);

      const latest = await Setting.findOne();
      expect(latest?.platformFeePercentage).toBe(15);
    });
  });

  describe('GET /api/v1/settings', () => {
    it('should fetch platform settings publicly', async () => {
      await Setting.create({
        platformFeePercentage: 10,
        contactInfo: {
          email: 'hello@cloudsalon.com',
        },
      });

      const res = await request(app).get('/api/v1/settings');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Setting fetched successfully');
      expect(res.body.data.platformFeePercentage).toBe(10);
      expect(res.body.data.contactInfo.email).toBe('hello@cloudsalon.com');
    });
  });
});
