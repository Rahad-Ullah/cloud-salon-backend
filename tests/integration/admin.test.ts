import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Admin } from '../../src/app/modules/admin/admin.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Admin Module API Endpoints', () => {
  const superAdminData = {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super.admin@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.SuperAdmin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const customerData = {
    firstName: 'Normal',
    lastName: 'Customer',
    email: 'customer@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/admins/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/admins/create')
        .send({
          name: 'Manager',
          email: 'manager@cloudsalon.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 when accessed by Customer or regular Admin', async () => {
      const customer = await User.create(customerData);
      const customerToken = createTestToken(UserRole.Customer, customer._id.toString(), customer.email);

      const res = await request(app)
        .post('/api/v1/admins/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Manager',
          email: 'manager@cloudsalon.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 when validation fails on payload', async () => {
      const superAdmin = await User.create(superAdminData);
      const superToken = createTestToken(UserRole.SuperAdmin, superAdmin._id.toString(), superAdmin.email);

      const res = await request(app)
        .post('/api/v1/admins/create')
        .set('Authorization', `Bearer ${superToken}`)
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when user with email already exists', async () => {
      const superAdmin = await User.create(superAdminData);
      const superToken = createTestToken(UserRole.SuperAdmin, superAdmin._id.toString(), superAdmin.email);

      await User.create(customerData);

      const res = await request(app)
        .post('/api/v1/admins/create')
        .set('Authorization', `Bearer ${superToken}`)
        .send({
          name: 'Existing Customer',
          email: customerData.email,
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Email already exists/i);
    });

    it('should successfully create an admin when authenticated as SuperAdmin', async () => {
      const superAdmin = await User.create(superAdminData);
      const superToken = createTestToken(UserRole.SuperAdmin, superAdmin._id.toString(), superAdmin.email);

      const res = await request(app)
        .post('/api/v1/admins/create')
        .set('Authorization', `Bearer ${superToken}`)
        .send({
          name: 'Regional Manager',
          email: 'regional.manager@cloudsalon.com',
          password: 'Password123!',
          phone: '1234567890',
          permissions: ['manage_salons', 'manage_chairs'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin created successfully');

      // Verify created User and Admin documents
      const createdUser = await User.findOne({ email: 'regional.manager@cloudsalon.com' });
      expect(createdUser).toBeDefined();
      expect(createdUser?.role).toBe(UserRole.Admin);
      expect(createdUser?.roleRef).toBeDefined();

      const createdAdmin = await Admin.findOne({ user: createdUser?._id });
      expect(createdAdmin).toBeDefined();
      expect(createdAdmin?.permissions).toContain('manage_salons');
    });
  });

  describe('PATCH /api/v1/admins/:id', () => {
    it('should return 401 when unauthenticated', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/v1/admins/${fakeId}`)
        .send({ permissions: ['all'] });

      expect(res.status).toBe(401);
    });

    it('should return 403 when called by non-SuperAdmin', async () => {
      const customer = await User.create(customerData);
      const customerToken = createTestToken(UserRole.Customer, customer._id.toString(), customer.email);

      const res = await request(app)
        .patch(`/api/v1/admins/${customer._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ permissions: ['all'] });

      expect(res.status).toBe(403);
    });

    it('should return 404 if targeted user is not found', async () => {
      const superAdmin = await User.create(superAdminData);
      const superToken = createTestToken(UserRole.SuperAdmin, superAdmin._id.toString(), superAdmin.email);
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/admins/${nonExistentId}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ permissions: ['new_permission'] });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/User not found/i);
    });

    it('should update admin permissions and details successfully', async () => {
      const superAdmin = await User.create(superAdminData);
      const superToken = createTestToken(UserRole.SuperAdmin, superAdmin._id.toString(), superAdmin.email);

      // Create admin user + admin doc
      const adminUser = await User.create({
        firstName: 'Branch',
        lastName: 'Manager',
        email: 'branch.manager@cloudsalon.com',
        password: 'Password123!',
        role: UserRole.Admin,
        isEmailVerified: true,
        status: UserStatus.Active,
      });

      const adminDoc = await Admin.create({
        user: adminUser._id,
        permissions: ['read_only'],
      });

      await User.findByIdAndUpdate(adminUser._id, { roleRef: adminDoc._id });

      const res = await request(app)
        .patch(`/api/v1/admins/${adminUser._id}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({
          name: 'Executive Manager',
          permissions: ['read_only', 'edit_salons'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin updated successfully');

      // Verify in DB
      const updatedAdmin = await Admin.findById(adminDoc._id);
      expect(updatedAdmin?.permissions).toContain('edit_salons');

      const updatedUser = await User.findById(adminUser._id);
      expect(updatedUser?.firstName).toBe('Executive');
      expect(updatedUser?.lastName).toBe('Manager');
    });
  });
});
