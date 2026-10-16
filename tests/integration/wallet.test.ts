import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Wallet } from '../../src/app/modules/wallet/wallet.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import {
  PayoutProvider,
  SupportedCurrency,
  WalletStatus,
} from '../../src/app/modules/wallet/wallet.constants';
import { createTestToken } from '../helpers/auth.helper';

describe('Wallet Module API Endpoints', () => {
  const proUserData = {
    firstName: 'Marcus',
    lastName: 'Stylist',
    email: 'marcus.wallet@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const customerUserData = {
    firstName: 'Emma',
    lastName: 'Client',
    email: 'emma.wallet@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/wallets/payout-method/connect', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/wallets/payout-method/connect')
        .send({
          currency: SupportedCurrency.USD,
          gatewayBankInfo: {
            [PayoutProvider.STRIPE]: {
              bankName: 'Chase',
              accountNumberLast4: '4242',
            },
          },
        });

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
        .post('/api/v1/wallets/payout-method/connect')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currency: SupportedCurrency.USD,
          gatewayBankInfo: {
            [PayoutProvider.STRIPE]: {
              bankName: 'Chase',
              accountNumberLast4: '4242',
            },
          },
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 when missing required gatewayBankInfo block', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      const res = await request(app)
        .post('/api/v1/wallets/payout-method/connect')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          currency: SupportedCurrency.USD,
          gatewayBankInfo: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should connect Stripe payout method and return onboardingUrl', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      const res = await request(app)
        .post('/api/v1/wallets/payout-method/connect')
        .set('Authorization', `Bearer ${proToken}`)
        .send({
          currency: SupportedCurrency.USD,
          gatewayBankInfo: {
            [PayoutProvider.STRIPE]: {
              bankName: 'Silicon Valley Bank',
              accountNumberLast4: '1234',
            },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Payout method connected successfully');
      expect(res.body.data).toHaveProperty('onboardingUrl');
      expect(res.body.data.wallet.status).toBe(WalletStatus.PENDING_ONBOARDING);

      const walletInDb = await Wallet.findOne({ user: proUser._id });
      expect(walletInDb).toBeDefined();
      expect(walletInDb?.provider).toBe(PayoutProvider.STRIPE);
    });
  });

  describe('POST /api/v1/wallets/payout-withdrawal', () => {
    it('should return 400 when wallet does not exist', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      const res = await request(app)
        .post('/api/v1/wallets/payout-withdrawal')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Wallet not found/i);
    });

    it('should return 400 when wallet is not active', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      await Wallet.create({
        user: proUser._id,
        status: WalletStatus.PENDING_ONBOARDING,
        availableBalance: 500,
        provider: PayoutProvider.STRIPE,
        currency: SupportedCurrency.USD,
      });

      const res = await request(app)
        .post('/api/v1/wallets/payout-withdrawal')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Wallet is not active/i);
    });

    it('should return 400 when amount exceeds available balance', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      await Wallet.create({
        user: proUser._id,
        status: WalletStatus.ACTIVE,
        availableBalance: 50,
        provider: PayoutProvider.STRIPE,
        currency: SupportedCurrency.USD,
        gatewayBankInfo: {
          [PayoutProvider.STRIPE]: {
            stripeAccountId: 'acct_test_mock_balance',
          },
        },
      });

      const res = await request(app)
        .post('/api/v1/wallets/payout-withdrawal')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ amount: 200 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient available balance/i);
    });

    it('should successfully initiate payout withdrawal', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      await Wallet.create({
        user: proUser._id,
        status: WalletStatus.ACTIVE,
        availableBalance: 800,
        provider: PayoutProvider.STRIPE,
        currency: SupportedCurrency.USD,
        gatewayBankInfo: {
          [PayoutProvider.STRIPE]: {
            stripeAccountId: 'acct_test_mock123',
          },
        },
      });

      const res = await request(app)
        .post('/api/v1/wallets/payout-withdrawal')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ amount: 300 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Withdrawal initiated successfully');
      expect(res.body.data.amount).toBe(300);
    });
  });

  describe('GET /api/v1/wallets/me', () => {
    it('should return 403 when called by Customer', async () => {
      const customer = await User.create(customerUserData);
      const customerToken = createTestToken(
        UserRole.Customer,
        customer._id.toString(),
        customer.email,
      );

      const res = await request(app)
        .get('/api/v1/wallets/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return wallet details for authenticated professional', async () => {
      const proUser = await User.create(proUserData);
      const proToken = createTestToken(
        UserRole.Professional,
        proUser._id.toString(),
        proUser.email,
      );

      await Wallet.create({
        user: proUser._id,
        status: WalletStatus.ACTIVE,
        availableBalance: 450,
        provider: PayoutProvider.STRIPE,
        currency: SupportedCurrency.USD,
      });

      const res = await request(app)
        .get('/api/v1/wallets/me')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Wallet fetched successfully');
      expect(res.body.data.availableBalance).toBe(450);
    });
  });
});
