import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Salon } from '../../src/app/modules/salon/salon.model';
import { Wishlist } from '../../src/app/modules/wishlist/wishlist.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { WishlistEntityType } from '../../src/app/modules/wishlist/wishlist.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Wishlist Module API Endpoints', () => {
  const customerUserData = {
    firstName: 'Chloe',
    lastName: 'Client',
    email: 'chloe.wishlist@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const proUserData = {
    firstName: 'Victor',
    lastName: 'Stylist',
    email: 'victor.wishlist@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const setupPrerequisites = async () => {
    const customer = await User.create(customerUserData);
    const professional = await User.create(proUserData);

    const salon = await Salon.create({
      name: 'Vogue Hair & Lounge',
      businessType: 'Hair Salon',
      email: 'vogue@cloudsalon.com',
      phone: '+1 987 654 3210',
      address: {
        line1: '123 Fashion Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10018',
        country: 'USA',
      },
      location: {
        type: 'Point',
        coordinates: [-73.98, 40.75],
      },
      createdBy: professional._id,
    });

    const customerToken = createTestToken(
      UserRole.Customer,
      customer._id.toString(),
      customer.email,
    );

    return {
      customer,
      professional,
      salon,
      customerToken,
    };
  };

  describe('POST /api/v1/wishlists/toggle', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/wishlists/toggle')
        .send({});

      expect(res.status).toBe(401);
    });

    it('should return 404 when target entity does not exist', async () => {
      const { customerToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/v1/wishlists/toggle')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          entityType: WishlistEntityType.Salon,
          entity: fakeId,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Entity not found/i);
    });

    it('should add to wishlist on first toggle and remove on second toggle', async () => {
      const { customerToken, salon, customer } = await setupPrerequisites();

      // First toggle: Adds to wishlist
      const res1 = await request(app)
        .post('/api/v1/wishlists/toggle')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          entityType: WishlistEntityType.Salon,
          entity: salon._id.toString(),
        });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.message).toBe('Wishlist toggled successfully');

      const savedItem = await Wishlist.findOne({
        user: customer._id,
        entity: salon._id,
      });
      expect(savedItem).toBeDefined();

      // Second toggle: Removes from wishlist
      const res2 = await request(app)
        .post('/api/v1/wishlists/toggle')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          entityType: WishlistEntityType.Salon,
          entity: salon._id.toString(),
        });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);

      const removedItem = await Wishlist.findOne({
        user: customer._id,
        entity: salon._id,
      });
      expect(removedItem).toBeNull();
    });
  });

  describe('DELETE /api/v1/wishlists/:id', () => {
    it('should return 404 for non-existent wishlist item', async () => {
      const { customerToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/v1/wishlists/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Wishlist not found/i);
    });

    it('should delete wishlist entry successfully', async () => {
      const { customerToken, customer, salon } = await setupPrerequisites();

      const item = await Wishlist.create({
        user: customer._id,
        entityType: WishlistEntityType.Salon,
        entity: salon._id,
      });

      const res = await request(app)
        .delete(`/api/v1/wishlists/${item._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Wishlist deleted successfully');
    });
  });

  describe('GET /api/v1/wishlists/single/:id', () => {
    it('should return 404 for non-existent wishlist id', async () => {
      const { customerToken } = await setupPrerequisites();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/wishlists/single/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });

    it('should return single wishlist item by id', async () => {
      const { customerToken, customer, salon } = await setupPrerequisites();

      const item = await Wishlist.create({
        user: customer._id,
        entityType: WishlistEntityType.Salon,
        entity: salon._id,
      });

      const res = await request(app)
        .get(`/api/v1/wishlists/single/${item._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Wishlist fetched successfully');
      expect(res.body.data._id).toBe(item._id.toString());
    });
  });

  describe('GET /api/v1/wishlists/me', () => {
    it('should return paginated wishlist items for authenticated user', async () => {
      const { customerToken, customer, salon } = await setupPrerequisites();

      await Wishlist.create({
        user: customer._id,
        entityType: WishlistEntityType.Salon,
        entity: salon._id,
      });

      const res = await request(app)
        .get('/api/v1/wishlists/me?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Wishlists fetched successfully');
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
