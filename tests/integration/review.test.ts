import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Review } from '../../src/app/modules/review/review.model';
import { Professional } from '../../src/app/modules/professional/professional.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { EntityType } from '../../src/app/modules/review/review.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Review Module API Endpoints', () => {
  const customerUserData = {
    firstName: 'Hannah',
    lastName: 'Reviewer',
    email: 'hannah.reviewer@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const proUserData = {
    firstName: 'Lucas',
    lastName: 'Stylist',
    email: 'lucas.stylist@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const setupPrerequisites = async () => {
    const customer = await User.create(customerUserData);
    const professional = await User.create(proUserData);

    await Professional.create({
      user: professional._id,
      bio: 'Top hair stylist',
      specialties: ['Styling'],
      experienceYears: 5,
    });

    const salon = await Salon.create({
      name: 'Downtown Chic Salon',
      businessType: 'Hair Salon',
      email: 'chic@cloudsalon.com',
      phone: '+1 234 567 8900',
      address: {
        line1: '789 Broadway',
        city: 'New York',
        state: 'NY',
        postalCode: '10003',
        country: 'USA',
      },
      location: {
        type: 'Point',
        coordinates: [-73.99, 40.73],
      },
      createdBy: professional._id,
    });

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

    return {
      customer,
      professional,
      salon,
      customerToken,
      proToken,
    };
  };

  describe('POST /api/v1/reviews/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/reviews/create')
        .send({});

      expect(res.status).toBe(401);
    });

    it('should return 400 when attempting to review oneself', async () => {
      const { proToken, professional } = await setupPrerequisites();

      const res = await request(app)
        .post('/api/v1/reviews/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          entityType: EntityType.User,
          entity: professional._id.toString(),
          rating: 5,
          comment: 'Self praise!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot review yourself/i);
    });

    it('should return 404 when target entity does not exist', async () => {
      const { customerToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/v1/reviews/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          entityType: EntityType.Salon,
          entity: fakeId,
          rating: 4,
          comment: 'Great atmosphere',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should create a review for Salon and update salon avgRating', async () => {
      const { customerToken, salon } = await setupPrerequisites();

      const res = await request(app)
        .post('/api/v1/reviews/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          entityType: EntityType.Salon,
          entity: salon._id.toString(),
          rating: 5,
          comment: 'Exceptional service and clean environment!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Review created successfully');
      expect(res.body.data.rating).toBe(5);

      // Verify salon was updated with avgRating = 5 and totalReviews = 1
      const updatedSalon = await Salon.findById(salon._id);
      expect(updatedSalon?.avgRating).toBe(5);
      expect(updatedSalon?.totalReviews).toBe(1);
    });
  });

  describe('PATCH /api/v1/reviews/:id', () => {
    it('should return 404 when review does not exist', async () => {
      const { customerToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 4 });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Review not found/i);
    });

    it('should return 403 when updating review belonging to another user', async () => {
      const { salon, customer, proToken } = await setupPrerequisites();

      const review = await Review.create({
        user: customer._id,
        entityType: EntityType.Salon,
        entity: salon._id,
        rating: 3,
        comment: 'Okay place',
      });

      const res = await request(app)
        .patch(`/api/v1/reviews/${review._id}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ rating: 5 });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not have permission|not authorized/i);
    });

    it('should update review and recalculate entity rating', async () => {
      const { customerToken, salon, customer } = await setupPrerequisites();

      const review = await Review.create({
        user: customer._id,
        entityType: EntityType.Salon,
        entity: salon._id,
        rating: 3,
        comment: 'Decent experience',
      });

      const res = await request(app)
        .patch(`/api/v1/reviews/${review._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 4, comment: 'Updated to very good experience!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Review updated successfully');
      expect(res.body.data.rating).toBe(4);
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should soft delete review and update entity rating', async () => {
      const { customerToken, salon, customer } = await setupPrerequisites();

      const review = await Review.create({
        user: customer._id,
        entityType: EntityType.Salon,
        entity: salon._id,
        rating: 5,
        comment: 'Will come back!',
      });

      const res = await request(app)
        .delete(`/api/v1/reviews/${review._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Review deleted successfully');

      const deleted = await Review.findById(review._id);
      expect(deleted?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/reviews/single/:id', () => {
    it('should return review by id', async () => {
      const { customer, salon } = await setupPrerequisites();

      const review = await Review.create({
        user: customer._id,
        entityType: EntityType.Salon,
        entity: salon._id,
        rating: 5,
        comment: 'Five stars!',
      });

      const res = await request(app).get(`/api/v1/reviews/single/${review._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Review fetched successfully');
      expect(res.body.data._id).toBe(review._id.toString());
    });
  });

  describe('GET /api/v1/reviews/me', () => {
    it('should return reviews submitted by authenticated user', async () => {
      const { customerToken, customer, salon } = await setupPrerequisites();

      await Review.create({
        user: customer._id,
        entityType: EntityType.Salon,
        entity: salon._id,
        rating: 4,
        comment: 'Nice place',
      });

      const res = await request(app)
        .get('/api/v1/reviews/me?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Reviews fetched successfully');
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/reviews', () => {
    it('should list all reviews with pagination', async () => {
      const { customer, salon } = await setupPrerequisites();

      await Review.create([
        {
          user: customer._id,
          entityType: EntityType.Salon,
          entity: salon._id,
          rating: 4,
          comment: 'Good',
        },
        {
          user: customer._id,
          entityType: EntityType.Salon,
          entity: salon._id,
          rating: 5,
          comment: 'Great',
        },
      ]);

      const res = await request(app).get('/api/v1/reviews?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
