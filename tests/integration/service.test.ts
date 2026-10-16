import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Category } from '../../src/app/modules/category/category.model';
import { Service } from '../../src/app/modules/service/service.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Service Module API Endpoints', () => {
  const proUserData = {
    firstName: 'Marco',
    lastName: 'Barber',
    email: 'marco.barber@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const customerUserData = {
    firstName: 'Alice',
    lastName: 'Client',
    email: 'alice.client@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/services/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/services/create')
        .send({ name: 'Haircut' });

      expect(res.status).toBe(401);
    });

    it('should return 403 when called by a Customer', async () => {
      const customer = await User.create(customerUserData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      const res = await request(app)
        .post('/api/v1/services/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Haircut' });

      expect(res.status).toBe(403);
    });

    it('should return 404 when category does not exist', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const fakeCategoryId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/v1/services/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          name: 'Classic Men Haircut',
          category: fakeCategoryId,
          description: 'Precision scissor cut with styling',
          priceInUSD: 35,
          durationInMinutes: 30,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Category not found/i);
    });

    it('should create a service successfully when called by Professional', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const category = await Category.create({
        name: 'Barber Services',
        image: 'barber.png',
      });

      const res = await request(app)
        .post('/api/v1/services/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          name: 'Classic Men Haircut',
          category: category._id.toString(),
          description: 'Precision scissor cut with styling',
          priceInUSD: 35,
          durationInMinutes: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Service created successfully');
      expect(res.body.data.name).toBe('Classic Men Haircut');
      expect(res.body.data.priceInUSD).toBe(35);
      expect(res.body.data.durationInMinutes).toBe(30);

      const serviceInDb = await Service.findById(res.body.data._id);
      expect(serviceInDb).toBeDefined();
      expect(serviceInDb?.createdBy.toString()).toBe(proUser._id.toString());
    });

    it('should return 409 conflict when creating duplicate service name by the same professional', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const category = await Category.create({
        name: 'Hair Cuts',
        image: 'hair.png',
      });

      const payload = {
        name: 'Fade & Beard Trim',
        category: category._id.toString(),
        description: 'Skin fade and hot towel trim',
        priceInUSD: 50,
        durationInMinutes: 45,
      };

      await request(app)
        .post('/api/v1/services/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(payload);

      const res = await request(app)
        .post('/api/v1/services/create')
        .set('Authorization', `Bearer ${proToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Name already taken/i);
    });
  });

  describe('PATCH /api/v1/services/:id', () => {
    it('should return 404 when updating non-existent service', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/services/${fakeId}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ priceInUSD: 45 });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Service not found/i);
    });

    it('should update service details successfully', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const category = await Category.create({
        name: 'Hair Care',
        image: 'haircare.png',
      });

      const service = await Service.create({
        name: 'Keratin Treatment',
        category: category._id,
        description: 'Brazilian blowout',
        priceInUSD: 150,
        durationInMinutes: 90,
        createdBy: proUser._id,
      });

      const res = await request(app)
        .patch(`/api/v1/services/${service._id}`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          priceInUSD: 180,
          description: 'Updated deluxe Brazilian blowout',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Service updated successfully');
      expect(res.body.data.priceInUSD).toBe(180);
      expect(res.body.data.description).toBe('Updated deluxe Brazilian blowout');
    });
  });

  describe('DELETE /api/v1/services/:id', () => {
    it('should soft delete service successfully', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const category = await Category.create({
        name: 'Color',
        image: 'color.png',
      });

      const service = await Service.create({
        name: 'Balayage',
        category: category._id,
        description: 'Hand-painted highlights',
        priceInUSD: 200,
        durationInMinutes: 120,
        createdBy: proUser._id,
      });

      const res = await request(app)
        .delete(`/api/v1/services/${service._id}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Service deleted successfully');

      const deletedService = await Service.findById(service._id);
      expect(deletedService?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/services/single/:id', () => {
    it('should return 404 for non-existent service id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/api/v1/services/single/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Service not found/i);
    });

    it('should return service details with populated relations', async () => {
      const proUser = await User.create(proUserData);
      const category = await Category.create({
        name: 'Styling',
        image: 'style.png',
      });

      const service = await Service.create({
        name: 'Bridal Updo',
        category: category._id,
        description: 'Full bridal hairstyle',
        priceInUSD: 120,
        durationInMinutes: 60,
        createdBy: proUser._id,
      });

      const res = await request(app).get(`/api/v1/services/single/${service._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Service fetched successfully');
      expect(res.body.data._id).toBe(service._id.toString());
      expect(res.body.data.category.name).toBe('Styling');
      expect(res.body.data.createdBy.email).toBe(proUserData.email);
    });
  });

  describe('GET /api/v1/services/my-services', () => {
    it('should list services created by authenticated professional', async () => {
      const pro1 = await User.create(proUserData);
      const pro2 = await User.create({
        ...proUserData,
        email: 'other.pro@cloudsalon.com',
      });
      const proToken1 = createTestToken(
        UserRole.Professional,
        pro1._id.toString(),
        pro1.email,
      );

      const category = await Category.create({
        name: 'Treatments',
        image: 'treat.png',
      });

      await Service.create([
        {
          name: 'Pro 1 Service 1',
          category: category._id,
          description: 'Desc 1',
          priceInUSD: 40,
          durationInMinutes: 30,
          createdBy: pro1._id,
        },
        {
          name: 'Pro 1 Service 2',
          category: category._id,
          description: 'Desc 2',
          priceInUSD: 60,
          durationInMinutes: 45,
          createdBy: pro1._id,
        },
        {
          name: 'Pro 2 Service',
          category: category._id,
          description: 'Desc 3',
          priceInUSD: 90,
          durationInMinutes: 60,
          createdBy: pro2._id,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/services/my-services?page=1&limit=10')
        .set('Authorization', `Bearer ${proToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Services fetched successfully');
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/services/professional/:id', () => {
    it('should return services for a specific professional id', async () => {
      const pro = await User.create(proUserData);
      const category = await Category.create({
        name: 'Beard Care',
        image: 'beard.png',
      });

      await Service.create({
        name: 'Luxury Hot Towel Shave',
        category: category._id,
        description: 'Straight razor shave',
        priceInUSD: 45,
        durationInMinutes: 30,
        createdBy: pro._id,
      });

      const res = await request(app).get(`/api/v1/services/professional/${pro._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Luxury Hot Towel Shave');
    });
  });

  describe('GET /api/v1/services/all', () => {
    it('should list all active services with pagination', async () => {
      const pro = await User.create(proUserData);
      const category = await Category.create({
        name: 'General',
        image: 'gen.png',
      });

      await Service.create([
        {
          name: 'Active Service 1',
          category: category._id,
          description: 'Desc 1',
          priceInUSD: 30,
          durationInMinutes: 30,
          createdBy: pro._id,
        },
        {
          name: 'Active Service 2',
          category: category._id,
          description: 'Desc 2',
          priceInUSD: 50,
          durationInMinutes: 45,
          createdBy: pro._id,
        },
        {
          name: 'Deleted Service',
          category: category._id,
          description: 'Desc 3',
          priceInUSD: 80,
          durationInMinutes: 60,
          createdBy: pro._id,
          isDeleted: true,
        },
      ]);

      const res = await request(app).get('/api/v1/services/all?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });
});
