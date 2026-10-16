import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Transaction } from '../../src/app/modules/transaction/transaction.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import {
  TransactionGateway,
  TransactionReferenceType,
  TransactionStatus,
  TransactionType,
} from '../../src/app/modules/transaction/transaction.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Transaction Module API Endpoints', () => {
  const adminUserData = {
    firstName: 'Admin',
    lastName: 'Finance',
    email: 'admin.finance@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Admin,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const proUserData = {
    firstName: 'Pierre',
    lastName: 'Stylist',
    email: 'pierre.stylist@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const customerUserData = {
    firstName: 'Clara',
    lastName: 'Customer',
    email: 'clara.customer@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('PATCH /api/v1/transactions/:id', () => {
    it('should return 401 when unauthenticated', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/v1/transactions/${fakeId}`)
        .send({ status: TransactionStatus.Completed });

      expect(res.status).toBe(401);
    });

    it('should return 403 when called by non-admin', async () => {
      const customer = await User.create(customerUserData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/transactions/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: TransactionStatus.Completed });

      expect(res.status).toBe(403);
    });

    it('should return 404 when transaction is not found', async () => {
      const admin = await User.create(adminUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/transactions/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TransactionStatus.Completed });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Transaction not found/i);
    });

    it('should update transaction status successfully when called by Admin', async () => {
      const admin = await User.create(adminUserData);
      const proUser = await User.create(proUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );

      const txn = await Transaction.create({
        user: proUser._id,
        type: TransactionType.Payment,
        gateway: TransactionGateway.Stripe,
        gatewayReferenceId: 'pi_test_status_update_123',
        amount: 80,
        netAmount: 80,
        status: TransactionStatus.Pending,
        reference: {
          type: TransactionReferenceType.Appointment,
          id: new mongoose.Types.ObjectId().toString(),
        },
      });

      const res = await request(app)
        .patch(`/api/v1/transactions/${txn._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TransactionStatus.Completed });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transaction status updated successfully');
      expect(res.body.data.status).toBe(TransactionStatus.Completed);
    });
  });

  describe('GET /api/v1/transactions/single/:id', () => {
    it('should return 401 when unauthenticated', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/transactions/single/${fakeId}`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent transaction', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/transactions/single/${fakeId}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Transaction not found/i);
    });

    it('should return transaction details when authenticated', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      const txn = await Transaction.create({
        user: proUser._id,
        type: TransactionType.Payment,
        gateway: TransactionGateway.Stripe,
        gatewayReferenceId: 'pi_test_single_fetch_123',
        amount: 120,
        netAmount: 120,
        status: TransactionStatus.Completed,
        isPaid: true,
        reference: {
          type: TransactionReferenceType.ChairRental,
          id: new mongoose.Types.ObjectId().toString(),
        },
      });

      const res = await request(app)
        .get(`/api/v1/transactions/single/${txn._id}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transaction fetched successfully');
      expect(res.body.data._id).toBe(txn._id.toString());
      expect(res.body.data.amount).toBe(120);
    });
  });

  describe('GET /api/v1/transactions/me', () => {
    it('should reject Customer role with 403', async () => {
      const customer = await User.create(customerUserData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      const res = await request(app)
        .get('/api/v1/transactions/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should list transactions of authenticated professional', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      await Transaction.create([
        {
          user: proUser._id,
          type: TransactionType.Payment,
          gateway: TransactionGateway.Stripe,
          gatewayReferenceId: 'pi_test_me_1',
          amount: 50,
          netAmount: 50,
          status: TransactionStatus.Completed,
          reference: {
            type: TransactionReferenceType.ChairRental,
            id: new mongoose.Types.ObjectId().toString(),
          },
        },
        {
          user: proUser._id,
          type: TransactionType.Payment,
          gateway: TransactionGateway.Stripe,
          gatewayReferenceId: 'pi_test_me_2',
          amount: 95,
          netAmount: 95,
          status: TransactionStatus.Completed,
          reference: {
            type: TransactionReferenceType.Appointment,
            id: new mongoose.Types.ObjectId().toString(),
          },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/transactions/me?page=1&limit=10')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transactions fetched successfully');
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('should reject non-admin with 403', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(403);
    });

    it('should return all transactions with pagination for Admin', async () => {
      const admin = await User.create(adminUserData);
      const proUser = await User.create(proUserData);
      const adminToken = createTestToken(
        UserRole.Admin,
        admin._id.toString(),
        admin.email,
      );

      await Transaction.create({
        user: proUser._id,
        type: TransactionType.Payment,
        gateway: TransactionGateway.Stripe,
        gatewayReferenceId: 'pi_test_all_1',
        amount: 250,
        netAmount: 250,
        status: TransactionStatus.Completed,
        reference: {
          type: TransactionReferenceType.Appointment,
          id: new mongoose.Types.ObjectId().toString(),
        },
      });

      const res = await request(app)
        .get('/api/v1/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transactions fetched successfully');
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
