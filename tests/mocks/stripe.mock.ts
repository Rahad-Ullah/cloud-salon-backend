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
          fee: 100,
          net: 900,
        },
      },
    }),
  },
  refunds: {
    create: vi.fn().mockResolvedValue({ id: 're_test_mock123', status: 'succeeded' }),
  },
  webhooks: {
    constructEvent: vi.fn().mockImplementation((body, signature, secret) => {
      if (signature && signature.includes('invalid')) {
        throw new Error('Invalid signature');
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
              transactionId: '665f1234567890abcdef1234',
              type: 'APPOINTMENT_PAYMENT',
            },
            payment_intent: 'pi_test_mock123',
          },
        },
        receivedAt: Math.floor(Date.now() / 1000),
      };
    }),
  },
};

export class MockStripe {
  checkout = stripeMock.checkout;
  paymentIntents = stripeMock.paymentIntents;
  refunds = stripeMock.refunds;
  webhooks = stripeMock.webhooks;
}

vi.mock('../../src/config/stripe', () => ({
  stripe: stripeMock,
}));

vi.mock('stripe', () => ({
  default: MockStripe,
}));
