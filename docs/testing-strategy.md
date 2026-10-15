# Testing Strategy & Architecture Guide

**Project:** `cloud-salon-backend`  
**Status:** Proposed / Review  
**Stack:** Node.js, Express, TypeScript, MongoDB (Mongoose), BullMQ (Redis), Redis/Redlock, AWS S3, Stripe, Nodemailer, Elasticsearch, Google GenAI (Gemini), Socket.io  

---

## 1. Executive Summary & Philosophy

For `cloud-salon-backend`, we adopt an **Integration-First Approach** based on the **Testing Trophy** model.

```
       /  E2E (Smoke)  \       (~5%)
      /-----------------\
     /   Integration     \     (~65%)  <-- HIGHEST ROI & FOCUS
    /---------------------\
   /      Unit Tests       \   (~25%)
  /-------------------------\
 /   Static (TS / Lint)      \ (~5%)
```

### Why Integration-First for `cloud-salon-backend`?
1. **Decoupled Application Architecture:** `src/app.ts` configures Express routes, middlewares, and error handlers without binding to a network port or starting DB connections (those live in `src/server.ts`). This makes `supertest` integration tests fast, clean, and isolated.
2. **Brittle Nature of Pure Controller/Service Unit Tests:** Mocking complex Mongoose query chains (`Model.find().populate().sort().exec()`) or Express `req, res, next` creates high maintenance overhead without verifying if Mongoose schema validations, indexes, pre/post hooks, or real database queries actually work.
3. **High Confidence with In-Memory MongoDB:** Running integration tests against `mongodb-memory-server` executes authentic queries against an ephemeral MongoDB binary in memory. It tests the complete request lifecycle:
   $$\text{HTTP Request} \rightarrow \text{Auth / RBAC} \rightarrow \text{Zod Validation} \rightarrow \text{Controller} \rightarrow \text{Service} \rightarrow \text{Mongoose} \rightarrow \text{HTTP Response}$$

---

## 2. Testing Layers & Distribution

### Layer 1: API Integration Tests (~65% of effort)
* **What to test:**
  * Authentication & Role-Based Access Control (RBAC): Verify status `401 Unauthorized` when unauthenticated, and `403 Forbidden` when accessing restricted endpoints (e.g., verifying `UserRole.Customer`, `UserRole.Professional`, `UserRole.Admin`, `UserRole.SuperAdmin` boundaries).
  * Zod Request Validation: Verify status `400 Bad Request` with structured error messages for invalid payloads.
  * Database operations: Happy paths (create, read, update, delete) and business conflicts (duplicate email/phone, overlapping salon chair rentals, conflicting appointment slots, invalid references, deactivated user accounts).
  * Error Handling: Standardized error responses via `globalErrorHandler.ts`.

### Layer 2: Unit Tests (~25% of effort)
* **What to test:**
  * Pure helpers and utilities without external dependencies.
  * `QueryBuilder.ts`: Filter parsing, search logic, sorting, and pagination calculations.
  * JWT helper functions (`jwtHelper.ts`).
  * Complex business domain logic (e.g., salon chair rental time overlap calculations, appointment slot availability checks, wallet balance & payout adjustments, commission calculations, Luxon date/time utilities).

### Layer 3: Worker & Webhook Isolation Tests (~10% of effort)
* **What to test:**
  * BullMQ Worker Processors: Test worker processor functions in isolation by passing mock `Job` payloads directly (e.g., `notification.worker.ts`, `mediaUpload.worker.ts`).
  * Stripe Webhooks: Test `stripeWebhookController` and handler logic (`checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`) using mock Stripe event payloads and mock signatures.

---

## 3. Recommended Technology Stack

| Role | Tool | Rationale |
| :--- | :--- | :--- |
| **Test Runner** | **Vitest** | Native TypeScript support out of the box via esbuild (instant startup, zero `ts-jest` compilation delay), Jest-compatible syntax (`describe`, `it`, `expect`, `vi`), and fast watch mode. |
| **HTTP Assertion** | **Supertest** | De-facto standard for Express HTTP integration testing without launching live network ports. |
| **Database** | **`mongodb-memory-server`** | In-memory ephemeral MongoDB binary. Zero external dependencies; runs on developer machines and CI pipelines seamlessly. |
| **Coverage** | **`@vitest/coverage-v8`** | Fast V8-based code coverage reporting. |

*(Alternative: Jest with `@swc/jest` can be used if team standards require Jest. However, Vitest requires significantly less boilerplate in modern TypeScript projects).*

---

## 4. Handling External Infrastructure & Side Effects

`cloud-salon-backend` relies on several external services. Tests must never perform real network calls to production or external resources.

```
       +---------------------------------------------+
       |             Test Suite Execution            |
       +---------------------------------------------+
              |                              |
       [Real Execution]               [Mocked Boundaries]
              |                              |
     +-----------------+          +---------------------+
     | Express App     |          | BullMQ / Redis      | -> tests/mocks/bullmq.mock.ts
     | Zod Validation  |          | Redis / Redlock     | -> tests/mocks/redis.mock.ts
     | Mongoose Models |          | Elasticsearch       | -> tests/mocks/elastic.mock.ts
     | Memory MongoDB  |          | AWS S3 Client       | -> tests/mocks/s3.mock.ts
     +-----------------+          | Nodemailer          | -> tests/mocks/nodemailer.mock.ts
                                  | Stripe SDK          | -> tests/mocks/stripe.mock.ts
                                  | Google GenAI        | -> tests/mocks/gemini.mock.ts
                                  +---------------------+
```

1. **MongoDB:** Real queries against `mongodb-memory-server`.
2. **BullMQ / Redis / Redlock:** Stubs prevent Redis socket connections and allow job queues and distributed locking to resolve immediately.
3. **Elasticsearch:** Client stubs prevent elastic cluster connection attempts.
4. **AWS S3:** Mock S3 client commands (`PutObjectCommand`, `DeleteObjectCommand`) to prevent accidental bucket writes.
5. **Nodemailer:** Stub transport verifies email dispatch and OTP generation without sending actual emails.
6. **Stripe:** Stub checkout sessions, payment intents, refunds, and webhook event verification without calling live Stripe APIs.
7. **Google GenAI (Gemini):** Mock AI client responses to prevent external API calls and token usage during automated tests.

---

## 5. Target Directory & File Structure

```text
cloud-salon-backend/
├── .github/
│   └── workflows/
│       ├── test.yml                   # CI/CD Automated Test & Lint Workflow
│       └── release.yml
├── docs/
│   └── testing-strategy.md            # This documentation
├── tests/
│   ├── setup.ts                       # Global test hooks (MongoMemoryServer, Global Mocks)
│   ├── helpers/
│   │   ├── auth.helper.ts             # JWT token generators for test roles
│   │   └── db.helper.ts               # Database clearing & seeding utilities
│   ├── mocks/
│   │   ├── bullmq.mock.ts             # BullMQ (Queue, Worker, QueueEvents, Job stubs)
│   │   ├── redis.mock.ts              # Redis / ioredis and Redlock connection stubs
│   │   ├── elastic.mock.ts            # Elasticsearch client stubs
│   │   ├── nodemailer.mock.ts         # Email delivery stub
│   │   ├── s3.mock.ts                 # AWS S3 upload/delete stub
│   │   ├── stripe.mock.ts             # Stripe client & webhook event stubs
│   │   └── gemini.mock.ts             # Google GenAI client stubs
│   └── integration/
│       ├── auth.test.ts               # Auth API flows (login, change-password, refresh)
│       ├── salon.test.ts              # Salon onboarding & owner management flows
│       ├── chairRental.test.ts        # Chair rental booking & concurrency test
│       ├── appointment.test.ts        # Customer appointment booking flows
│       ├── wallet.test.ts             # Wallet transaction & balance flows
│       └── stripe.webhook.test.ts     # Stripe webhook endpoint tests
├── src/
│   └── app/
│       └── builder/
│           └── QueryBuilder.spec.ts   # Co-located unit tests
├── vitest.config.ts                   # Vitest configuration file
└── package.json                       # Scripts for running tests
```

### 5.1 Why Dedicated Mock Files in `tests/mocks/`?
Instead of inlining all mocks directly into `tests/setup.ts`:
1. **Separation of Concerns:** Keeps `setup.ts` concise and focused strictly on the test lifecycle (starting Mongo, wiping collections, stopping Mongo).
2. **Reusability & Granular Assertions:** Dedicated mock modules can export their spy functions (e.g. `sendMailSpy`, `queueAddSpy`). Individual test suites (such as testing OTP delivery or worker dispatch) can import the mock and make assertions:
   ```typescript
   expect(sendMailSpy).toHaveBeenCalledWith(
     expect.objectContaining({ to: 'customer@cloudsalon.com' })
   );
   ```
3. **Maintainability:** When an SDK (e.g., `@elastic/elasticsearch` or `bullmq`) updates its API, changes are isolated to a single mock file.

---

## 6. Implementation Reference Templates

### 6.1. Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['tests/**/*.test.ts', 'src/**/*.{spec,test}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist/**',
        'node_modules/**',
        'tests/**',
        'src/server.ts',
        'src/dev-server.ts',
      ],
    },
  },
});
```

### 6.2. Mock Modules (`tests/mocks/`)

#### BullMQ Mock (`tests/mocks/bullmq.mock.ts`)
```typescript
import { vi } from 'vitest';

export const queueAddSpy = vi.fn().mockResolvedValue({ id: 'mock-job-id' });

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: queueAddSpy,
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  QueueEvents: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Job: vi.fn().mockImplementation(() => ({
    id: 'mock-job-id',
    data: {},
    updateProgress: vi.fn().mockResolvedValue(undefined),
  })),
}));
```

#### Redis & Redlock Mock (`tests/mocks/redis.mock.ts`)
```typescript
import { vi } from 'vitest';

vi.mock('ioredis', () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    disconnect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    status: 'ready',
  }));
  return {
    default: RedisMock,
    Redis: RedisMock,
  };
});

vi.mock('redlock', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      acquire: vi.fn().mockResolvedValue({
        release: vi.fn().mockResolvedValue(undefined),
        extend: vi.fn().mockResolvedValue(undefined),
      }),
      using: vi.fn().mockImplementation(async (_resources, _ttl, routine) => {
        return routine({ release: vi.fn() });
      }),
      on: vi.fn(),
    })),
  };
});
```

#### Elasticsearch Mock (`tests/mocks/elastic.mock.ts`)
```typescript
import { vi } from 'vitest';

export const elasticSearchMock = {
  index: vi.fn().mockResolvedValue({ result: 'created' }),
  search: vi.fn().mockResolvedValue({ hits: { hits: [], total: { value: 0 } } }),
  update: vi.fn().mockResolvedValue({ result: 'updated' }),
  delete: vi.fn().mockResolvedValue({ result: 'deleted' }),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../src/config/elastic-search', () => ({
  elasticSearch: elasticSearchMock,
}));
```

#### Nodemailer Mock (`tests/mocks/nodemailer.mock.ts`)
```typescript
import { vi } from 'vitest';

export const sendMailSpy = vi.fn().mockResolvedValue({ messageId: 'mock-email-id' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailSpy,
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));
```

#### S3 Mock (`tests/mocks/s3.mock.ts`)
```typescript
import { vi } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: vi.fn().mockImplementation(args => args),
  DeleteObjectCommand: vi.fn().mockImplementation(args => args),
}));
```

#### Stripe Mock (`tests/mocks/stripe.mock.ts`)
```typescript
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

vi.mock('../../src/config/stripe', () => ({
  stripe: stripeMock,
}));
```

#### Google GenAI (Gemini) Mock (`tests/mocks/gemini.mock.ts`)
```typescript
import { vi } from 'vitest';

export const geminiMock = {
  models: {
    generateContent: vi.fn().mockResolvedValue({
      text: vi.fn().mockReturnValue('Mocked AI analysis response'),
    }),
  },
};

vi.mock('../../src/config/gemini', () => ({
  gemini: geminiMock,
}));
```

---

### 6.3. Global Test Setup (`tests/setup.ts`)

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Load all external service mocks
import './mocks/bullmq.mock';
import './mocks/redis.mock';
import './mocks/elastic.mock';
import './mocks/nodemailer.mock';
import './mocks/s3.mock';
import './mocks/stripe.mock';
import './mocks/gemini.mock';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start ephemeral MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Wipe all collections between tests to guarantee state isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Gracefully terminate connections
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

---

### 6.4. Authentication Test Helper (`tests/helpers/auth.helper.ts`)

```typescript
import { Secret } from 'jsonwebtoken';
import config from '../../src/config';
import { jwtHelper } from '../../src/helpers/jwtHelper';
import { UserRole } from '../../src/app/modules/user/user.constant';

export const createTestToken = (
  role: UserRole = UserRole.Customer,
  userId: string = '665f1234567890abcdef1234',
  email: string = 'customer@cloudsalon.com'
): string => {
  return jwtHelper.createToken(
    { id: userId, role, email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in || '1h'
  );
};
```

---

### 6.5. Sample API Integration Test (`tests/integration/auth.test.ts`)

```typescript
import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Auth Module API Endpoints', () => {
  const testUserData = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Seed an active, verified customer user for login tests
      await User.create(testUserData);
    });

    it('should return 400 when request body fails Zod validation (missing password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@cloudsalon.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorMessages).toBeDefined();
    });

    it('should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@cloudsalon.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/doesn't exist|Invalid email/i);
    });

    it('should return 400 when password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/incorrect|Invalid email/i);
    });

    it('should return 407 if email is not verified', async () => {
      await User.updateOne(
        { email: testUserData.email },
        { isEmailVerified: false }
      );

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });

      expect(res.status).toBe(407);
      expect(res.body.message).toMatch(/verify your account/i);
    });

    it('should log in successfully and return JWT tokens for valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User logged in successfully.');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('role', UserRole.Customer);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    let createdUser: any;
    let customerToken: string;

    beforeEach(async () => {
      createdUser = await User.create(testUserData);
      customerToken = createTestToken(
        UserRole.Customer,
        createdUser._id.toString(),
        createdUser.email
      );
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully change password when authenticated with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Your password has been successfully changed');

      // Verify new password can now be used to log in
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserData.email,
          password: 'NewPassword456!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });
  });
});
```

---

## 7. Implementation Roadmap & CI/CD Pipeline

### Phase 1: Infrastructure Setup (Sprint 1)
- Ensure required test dependencies are installed:
  ```bash
  yarn add -D mongodb-memory-server @vitest/coverage-v8
  ```
  *(Note: `vitest`, `supertest`, and `@types/supertest` are already part of `devDependencies` in `package.json`).*
- Update `vitest.config.ts` to include `tests/**/*.test.ts` and `setupFiles: ['./tests/setup.ts']`.
- Implement `tests/mocks/*` (BullMQ, Redis/Redlock, Elasticsearch, Nodemailer, S3, Stripe, Gemini).
- Implement `tests/setup.ts` and `tests/helpers/auth.helper.ts`.
- Ensure test scripts are configured in `package.json`:
  ```json
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
  ```

### Phase 2: Critical Path API Tests (Sprint 1 - 2)
- **Auth Module:** Register, Login, Refresh Token, Forgot/Reset Password, Verify OTP, Change Password.
- **User & Professional Module:** Profile update, professional onboarding & profile fulfillment check, role guards (`UserRole.Admin`, `UserRole.SuperAdmin`).
- **Salon & Chair Rental Module:** Salon creation, chair listings, rental bookings with Redlock concurrency lock verification.
- **Appointment & Service Module:** Service browsing by category, appointment slot reservation, booking status lifecycle.
- **Wallet & Transactions:** Platform commission deductions, balance updates, payout requests.

### Phase 3: Utilities & Worker Verification (Sprint 2)
- Unit test `QueryBuilder` (pagination, search, filtering, and field selection edge cases).
- Unit test BullMQ workers (`notification.worker.ts`, `mediaUpload.worker.ts`) with mock jobs.
- Stripe webhook integration tests (`checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`).

### Phase 4: CI/CD Automation (Sprint 3)
Add a test workflow file (`.github/workflows/test.yml`) to automatically run linting and tests on every pull request and push to main branches.

#### Production CI Workflow (`.github/workflows/test.yml`)
```yaml
name: 🧪 Automated Tests & Lint (Cloud Salon Backend)

on:
  push:
    branches:
      - main
      - master
      - stage
      - dev
  pull_request:
    branches:
      - main
      - master
      - stage
      - dev

jobs:
  test:
    name: Run Unit & Integration Tests
    runs-on: ubuntu-latest

    env:
      NODE_ENV: test
      PORT: 5000
      BCRYPT_SALT_ROUNDS: 10
      JWT_SECRET: test_jwt_secret_key_12345
      JWT_EXPIRE_IN: 1d
      JWT_REFRESH_SECRET: test_jwt_refresh_secret_key_12345
      JWT_REFRESH_EXPIRE_IN: 30d
      STRIPE_SECRET_KEY: sk_test_mock_secret_key
      STRIPE_API_VERSION: 2024-06-20
      STRIPE_WEBHOOK_SECRET: whsec_test_mock_webhook_secret
      GEMINI_API_KEY: test_mock_gemini_api_key
      AWS_REGION: us-east-1
      AWS_ACCESS_KEY_ID: test_mock_aws_access_key
      AWS_SECRET_ACCESS_KEY: test_mock_aws_secret_key
      S3_BUCKET_NAME: test-cloud-salon-bucket

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'yarn'

      - name: Install Dependencies
        run: yarn install --frozen-lockfile

      - name: Run ESLint Check
        run: yarn lint:check

      - name: Run Tests with Coverage
        run: yarn test:coverage

      - name: Upload Test Coverage Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-coverage-report
          path: coverage/
          retention-days: 14
```

---

## 8. Best Practices & Team Guidelines

1. **Maintain State Isolation:** Never rely on state from previous tests. Always let `afterEach` clean collections so tests can run in parallel and in any order.
2. **Never Mock Mongoose Queries in Integration Tests:** Always let queries execute against the in-memory database to catch schema breaks, index constraints, and syntax errors.
3. **Always Mock Network Boundaries:** External APIs (Stripe, AWS S3, Redis, Nodemailer, Gemini AI) must never be contacted during automated test runs. Keep their mock implementations organized in `tests/mocks/`.
4. **Test Behavior, Not Implementation:** Focus assertions on HTTP response codes, response bodies, and the resulting state in the database, rather than verifying exact internal function call counts.
