import { vi } from 'vitest';

export const stripeMock = {
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: 'cs_test_mock123',
        url: 'https://checkout.stripe.com/pay/mock',
      }),
      retrieve: vi.fn().mockResolvedValue({ status: 'open' }),
    },
  },
  paymentIntents: {
    retrieve: vi.fn().mockResolvedValue({
      id: 'pi_test_mock123',
      latest_charge: {
        id: 'ch_test_mock123',
        balance_transaction: {
          id: 'txn_test_mock123',
          amount: 5000,
          fee: 100,
          net: 4900,
        },
      },
    }),
  },
  refunds: {
    create: vi.fn().mockResolvedValue({ id: 're_test_mock123', status: 'succeeded' }),
  },
  webhooks: {
    constructEvent: vi.fn().mockImplementation((body, signature, _secret) => {
      if (signature && signature.includes('invalid')) {
        throw new Error('Invalid signature');
      }
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        try {
          const parsed = JSON.parse(body.toString());
          if (parsed && parsed.type && parsed.data) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
      return {
        id: 'evt_test_mock123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock123',
            amount_total: 5000,
            currency: 'usd',
            metadata: {
              userId: '665f1234567890abcdef1234',
              referenceType: 'Appointment',
              referenceId: '665f1234567890abcdef5678',
            },
            payment_intent: 'pi_test_mock123',
          },
        },
        receivedAt: Math.floor(Date.now() / 1000),
      };
    }),
  },
  accounts: {
    create: vi.fn().mockResolvedValue({ id: 'acct_test_mock123' }),
  },
  accountLinks: {
    create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/setup/mock' }),
  },
  balance: {
    retrieve: vi.fn().mockResolvedValue({
      available: [
        { currency: 'usd', amount: 1000000 },
        { currency: 'USD', amount: 1000000 },
      ],
    }),
  },
  transfers: {
    create: vi.fn().mockResolvedValue({ id: 'tr_test_mock123' }),
  },
};

export class MockStripe {
  checkout = stripeMock.checkout;
  paymentIntents = stripeMock.paymentIntents;
  refunds = stripeMock.refunds;
  webhooks = stripeMock.webhooks;
  accounts = stripeMock.accounts;
  accountLinks = stripeMock.accountLinks;
  balance = stripeMock.balance;
  transfers = stripeMock.transfers;
}

vi.mock('../../src/config/stripe', () => ({
  stripe: stripeMock,
}));

vi.mock('stripe', () => ({
  default: MockStripe,
}));
