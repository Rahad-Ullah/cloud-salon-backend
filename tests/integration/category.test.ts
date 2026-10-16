import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Category } from '../../src/app/modules/category/category.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Category Module API Endpoints', () => {
  const adminUserData = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin.cat@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Admin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const proUserData = {
    firstName: 'Pro',
    lastName: 'Stylist',
    email: 'pro.cat@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const sampleCategoryPayload = {
    name: 'Hair Styling & Cutting',
    image: 'https://cloudsalon-bucket.s3.amazonaws.com/category/hair.png',
  };

  describe('POST /api/v1/categories/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/categories/create')
        .send(sampleCategoryPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 when non-admin tries to create a category', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      const res = await request(app)
        .post('/api/v1/categories/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(sampleCategoryPayload);

      expect(res.status).toBe(403);
    });

    it('should return 400 when required fields are missing', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );

      const res = await request(app)
        .post('/api/v1/categories/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Only Name' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create a new category successfully when called by Admin', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );

      const res = await request(app)
        .post('/api/v1/categories/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleCategoryPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Category created successfully');
      expect(res.body.data.name).toBe(sampleCategoryPayload.name);
      expect(res.body.data.image).toBe(sampleCategoryPayload.image);

      const categoryInDb = await Category.findOne({ name: sampleCategoryPayload.name });
      expect(categoryInDb).toBeDefined();
      expect(categoryInDb?.isDeleted).toBe(false);
    });

    it('should return 409 conflict when creating category with duplicate name', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );

      await Category.create(sampleCategoryPayload);

      const res = await request(app)
        .post('/api/v1/categories/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleCategoryPayload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Category already exists/i);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('should return 403 when called by non-admin', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const cat = await Category.create(sampleCategoryPayload);

      const res = await request(app)
        .patch(`/api/v1/categories/${cat._id}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ name: 'Updated Hair Category' });

      expect(res.status).toBe(403);
    });

    it('should return 404 if category does not exist', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Non Existent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Category not found/i);
    });

    it('should return 409 if updating to a name already taken by another category', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );

      await Category.create({ name: 'Coloring & Highlights', image: 'url1' });
      const cat2 = await Category.create({ name: 'Skin Care', image: 'url2' });

      const res = await request(app)
        .patch(`/api/v1/categories/${cat2._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Coloring & Highlights' });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Name already taken/i);
    });

    it('should update category successfully', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );
      const cat = await Category.create(sampleCategoryPayload);

      const res = await request(app)
        .patch(`/api/v1/categories/${cat._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Deluxe Hair & Beard Styling',
          image: 'https://cloudsalon-bucket.s3.amazonaws.com/category/new-hair.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Category updated successfully');
      expect(res.body.data.name).toBe('Deluxe Hair & Beard Styling');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should return 403 when called by non-admin', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const cat = await Category.create(sampleCategoryPayload);

      const res = await request(app)
        .delete(`/api/v1/categories/${cat._id}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(403);
    });

    it('should soft delete category successfully', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );
      const cat = await Category.create(sampleCategoryPayload);

      const res = await request(app)
        .delete(`/api/v1/categories/${cat._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Category deleted successfully');

      const deletedCat = await Category.findById(cat._id);
      expect(deletedCat?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('should list all non-deleted categories publicly', async () => {
      await Category.create([
        { name: 'Nails & Pedicure', image: 'nail.png' },
        { name: 'Facial & Spa', image: 'spa.png' },
        { name: 'Deleted Cat', image: 'del.png', isDeleted: true },
      ]);

      const res = await request(app).get('/api/v1/categories?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Categories fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter categories by searchTerm', async () => {
      await Category.create([
        { name: 'Nails & Pedicure', image: 'nail.png' },
        { name: 'Facial & Spa', image: 'spa.png' },
      ]);

      const res = await request(app).get('/api/v1/categories?searchTerm=Nail');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Nails & Pedicure');
    });
  });
});
