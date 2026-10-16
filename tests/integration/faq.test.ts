import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { Faq } from '../../src/app/modules/faq/faq.model';
import { UserRole } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('FAQ Module API Endpoints', () => {
  const adminToken = createTestToken(
    UserRole.Admin,
    new mongoose.Types.ObjectId().toString(),
    'admin.faq@cloudsalon.com',
  );
  const customerToken = createTestToken(
    UserRole.Customer,
    new mongoose.Types.ObjectId().toString(),
    'customer.faq@cloudsalon.com',
  );

  describe('POST /api/v1/faqs/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/faqs/create')
        .send({
          question: 'How do I book an appointment?',
          answer: 'Select a professional and pick a chair slot.',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 when accessed by Customer', async () => {
      const res = await request(app)
        .post('/api/v1/faqs/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          question: 'How do I book an appointment?',
          answer: 'Select a professional and pick a chair slot.',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 when question or answer is missing', async () => {
      const res = await request(app)
        .post('/api/v1/faqs/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create FAQ successfully when accessed by Admin', async () => {
      const res = await request(app)
        .post('/api/v1/faqs/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: 'How do I book an appointment?',
          answer: 'Select a professional and pick a chair slot.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('FAQ created successfully');
      expect(res.body.data.question).toBe('How do I book an appointment?');
      expect(res.body.data.answer).toBe('Select a professional and pick a chair slot.');
    });
  });

  describe('PATCH /api/v1/faqs/:id', () => {
    it('should return 403 when non-admin attempts to update FAQ', async () => {
      const faq = await Faq.create({
        question: 'Original Question',
        answer: 'Original Answer',
      });

      const res = await request(app)
        .patch(`/api/v1/faqs/${faq._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ answer: 'Updated Answer' });

      expect(res.status).toBe(403);
    });

    it('should return 404 when FAQ does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/faqs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answer: 'Updated Answer' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/FAQ not found/i);
    });

    it('should update FAQ successfully when accessed by Admin', async () => {
      const faq = await Faq.create({
        question: 'Original Question',
        answer: 'Original Answer',
      });

      const res = await request(app)
        .patch(`/api/v1/faqs/${faq._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Updated Question', answer: 'Updated Answer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('FAQ updated successfully');
      expect(res.body.data.question).toBe('Updated Question');
      expect(res.body.data.answer).toBe('Updated Answer');
    });
  });

  describe('DELETE /api/v1/faqs/:id', () => {
    it('should return 403 when non-admin attempts to delete FAQ', async () => {
      const faq = await Faq.create({
        question: 'To be deleted',
        answer: 'Some answer',
      });

      const res = await request(app)
        .delete(`/api/v1/faqs/${faq._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when FAQ does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/v1/faqs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should delete FAQ successfully when accessed by Admin', async () => {
      const faq = await Faq.create({
        question: 'To be deleted',
        answer: 'Some answer',
      });

      const res = await request(app)
        .delete(`/api/v1/faqs/${faq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('FAQ deleted successfully');

      const deletedFaq = await Faq.findById(faq._id);
      expect(deletedFaq).toBeNull();
    });
  });

  describe('GET /api/v1/faqs/:id', () => {
    it('should return 404 when FAQ does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/api/v1/faqs/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should fetch single FAQ publicly', async () => {
      const faq = await Faq.create({
        question: 'Is parking available?',
        answer: 'Yes, free guest parking is provided.',
      });

      const res = await request(app).get(`/api/v1/faqs/${faq._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('FAQ fetched successfully');
      expect(res.body.data._id).toBe(faq._id.toString());
      expect(res.body.data.question).toBe('Is parking available?');
    });
  });

  describe('GET /api/v1/faqs', () => {
    it('should fetch all FAQs publicly', async () => {
      await Faq.create([
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ]);

      const res = await request(app).get('/api/v1/faqs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('FAQs fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });
});
