import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { UserRole } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Media Upload Module API Endpoints', () => {
  const customerToken = createTestToken(
    UserRole.Customer,
    new mongoose.Types.ObjectId().toString(),
    'uploader@cloudsalon.com',
  );

  describe('POST /api/v1/media-uploads/upload', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/media-uploads/upload')
        .attach('image', Buffer.from('fake image content'), 'test.png');

      expect(res.status).toBe(401);
    });

    it('should return 200 and uploaded image url when image is attached', async () => {
      const res = await request(app)
        .post('/api/v1/media-uploads/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('image', Buffer.from('fake image content'), 'test.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('File uploaded successfully');
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.images.length).toBe(1);
      expect(res.body.data.images[0]).toMatch(/test.*\.png$/i);
    });

    it('should handle multiple files across categories (image, doc)', async () => {
      const res = await request(app)
        .post('/api/v1/media-uploads/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('image', Buffer.from('image 1'), 'photo1.jpg')
        .attach('doc', Buffer.from('%PDF-1.4 fake pdf'), 'contract.pdf');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images.length).toBe(1);
      expect(res.body.data.documents.length).toBe(1);
    });

    it('should return 200 with empty arrays when no file is attached', async () => {
      const res = await request(app)
        .post('/api/v1/media-uploads/upload')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toEqual([]);
      expect(res.body.data.videos).toEqual([]);
      expect(res.body.data.documents).toEqual([]);
    });
  });
});
