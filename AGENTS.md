# AI Agent Guidelines for `cloud-salon-backend`

This document serves as the primary context, architectural blueprint, and behavioral rulebook for AI coding assistants working in the `cloud-salon-backend` repository.

---

## 1. Project Overview & Technology Stack

* **Runtime & Language:** Node.js (v20+) with TypeScript (v5.5+) in CommonJS mode.
* **Web Framework:** Express 4.x (REST API).
* **Database:** MongoDB managed with Mongoose 8.x.
* **Message Queues & Distributed Locks:** BullMQ 6.x and Redlock 5.x with Redis (`ioredis`).
* **Search Engine:** Elasticsearch 8.x (`@elastic/elasticsearch`).
* **Validation:** Zod (v3.23+).
* **Testing:** Vitest 5.x, Supertest 7.x, `mongodb-memory-server` 11.x, `@vitest/coverage-v8`.
* **Third-Party Integrations:** Stripe (webhooks and checkout), AWS S3 (`@aws-sdk/client-s3`), Nodemailer, Socket.IO, Google GenAI.
* **Code Quality & Commits:** ESLint, Prettier, Commitizen (Conventional Commits).

---

## 2. Architecture & File Organization

### 2.1 Decoupled Entrypoints
* `src/app.ts`: **Only** mounts Express middleware, body parsers, routes (`/api/v1`), static files, the global error handler, and exports `app`. It **never** starts a network listener or database connection.
* `src/server.ts` / `src/dev-server.ts`: Connects to MongoDB, initializes BullMQ workers, binds Socket.IO, initializes Elasticsearch indexes, and calls `app.listen()`.
* **Rule:** Do not import or start `server.ts` in tests. Always import `app` from `src/app.ts` for HTTP testing with `supertest`.

### 2.2 Modular Directory Layout (`src/app/modules/<moduleName>`)
Every domain feature lives in its own dedicated module under `src/app/modules/<camelCaseName>`:
```text
src/app/modules/<module>/
├── <module>.interface.ts       # TypeScript interfaces and Mongoose model types
├── <module>.model.ts           # Mongoose schema, statics, methods, hooks, indexes
├── <module>.validation.ts      # Zod validation schemas
├── <module>.constants.ts       # Enums, statuses, constants
├── <module>.service.ts         # Business logic and database interactions
├── <module>.controller.ts      # Request/response handlers (catchAsync, sendResponse)
├── <module>.route.ts           # Express router with auth() and validateRequest()
├── <module>.queue.ts           # (Optional) BullMQ queue producer jobs
├── <module>.worker.ts          # (Optional) BullMQ worker consumers
├── <module>.elastic.index.ts   # (Optional) Elasticsearch mapping definitions
└── <module>.elastic.sync.ts    # (Optional) Elasticsearch synchronization logic
```

### 2.3 Route Mounting
* All module routes must be registered in `src/routes/index.ts`.
* Paths in `src/routes/index.ts` must use **pluralized kebab-case** (e.g., `/users`, `/salons`, `/chairs`, `/chair-rentals`, `/appointments`, `/services`, `/auth`, `/media-uploads`).

---

## 3. Implementation Rules & Best Practices

### 3.1 Controllers & Responses
1. Always wrap controller methods with `catchAsync`:
   ```typescript
   import catchAsync from '../../../shared/catchAsync';
   import sendResponse from '../../../shared/sendResponse';
   import { StatusCodes } from 'http-status-codes';

   const myAction = catchAsync(async (req: Request, res: Response) => {
     const result = await MyService.doSomething(req.body);
     sendResponse(res, {
       success: true,
       statusCode: StatusCodes.OK,
       message: 'Action completed successfully',
       data: result,
     });
   });
   ```
2. **Never** return raw HTTP responses like `res.json(...)` directly in controllers. Always use `sendResponse`.
3. Use semantic status codes from `http-status-codes` (`StatusCodes.OK`, `StatusCodes.CREATED`, `StatusCodes.BAD_REQUEST`, etc.).

### 3.2 Error Handling
1. Throw `ApiError` for all operational errors:
   ```typescript
   import ApiError from '../../../errors/ApiError';
   import { StatusCodes } from 'http-status-codes';

   throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not exist');
   ```
2. Never send manual error responses; let the `globalErrorHandler` middleware handle formatting and logging.

### 3.3 Validation (Zod)
1. Always define strict Zod schemas in `<module>.validation.ts` validating `body`, `params`, or `query`:
   ```typescript
   import { z } from 'zod';

   const createItemZodSchema = z.object({
     body: z.object({
       name: z.string({ required_error: 'Name is required' }).nonempty(),
     }).strict(),
   });
   ```
2. Apply schemas to routes using `validateRequest(MyValidation.schema)`.

### 3.4 Authentication & RBAC
1. Protect routes using `auth(...roles)` from `src/app/middlewares/auth.ts`:
   ```typescript
   import auth from '../../middlewares/auth';
   import { UserRole } from '../user/user.constant';

   // Protected for any authenticated user:
   router.get('/profile', auth(), UserController.getUserProfile);

   // Protected for specific roles (Customer, Professional, Admin, SuperAdmin):
   router.delete('/:id', auth(UserRole.Admin, UserRole.SuperAdmin), UserController.deleteSingleUser);
   router.post('/rentals', auth(UserRole.Professional), ChairRentalController.createRental);
   ```
2. Token payload shape: `{ id, role, email }`. Access user via `req.user.id` or `req.user.role`.

### 3.5 Database & Transactions
* Use `mongoose.startSession()` and `session.startTransaction()` when mutating multiple documents that require ACID compliance.
* Always commit or abort transactions in a `try...catch...finally` block with `session.endSession()`.

---

## 4. Testing Standards (Vitest + Supertest)

Testing strategy documentation is maintained in `docs/testing-strategy.md`.

### 4.1 Testing Philosophy
* **Integration-First:** Prioritize API endpoint integration tests (`tests/integration/<module>.test.ts`) over mocking Mongoose queries in unit tests.
* **In-Memory Database:** Tests automatically run against an ephemeral in-memory MongoDB replica set via `mongodb-memory-server` (configured in `tests/setup.ts`).
* **Test Isolation:** Collections are wiped in `afterEach` in `tests/setup.ts`. Never assume previous state exists.
* **External Stubs:** Never make real network requests to external services. Use existing mocks in `tests/mocks/`:
  * BullMQ: `tests/mocks/bullmq.mock.ts`
  * Redis & Redlock: `tests/mocks/redis.mock.ts`
  * Elasticsearch: `tests/mocks/elastic.mock.ts`
  * Nodemailer: `tests/mocks/nodemailer.mock.ts`
  * AWS S3: `tests/mocks/s3.mock.ts`
  * Stripe: `tests/mocks/stripe.mock.ts`
  * Google Gemini AI: `tests/mocks/gemini.mock.ts`

### 4.2 Test Helpers
* Use `createTestToken(role, userId, email)` from `tests/helpers/auth.helper.ts` to generate valid JWTs for testing protected endpoints (defaults to `UserRole.Customer`).

### 4.3 Running Tests
* `yarn test` - Run all test suites.
* `yarn test:watch` - Interactive watch mode.
* `yarn test:coverage` - Run tests and generate HTML coverage in `coverage/`.

---

## 5. Development Workflow & Commands

| Task | Command |
| :--- | :--- |
| **Start Dev Server** | `yarn dev` |
| **Build for Production** | `yarn build` |
| **Scaffold New Module** | `yarn cm` (runs `src/scripts/create-module.ts`) |
| **Run All Tests** | `yarn test` |
| **Test Watch Mode** | `yarn test:watch` |
| **Generate Coverage** | `yarn test:coverage` |
| **Check Linting** | `yarn lint:check` |
| **Fix Linting** | `yarn lint:fix` |
| **Format with Prettier** | `yarn prettier:fix` |
| **Commit Changes** | `yarn commit` (Conventional Commits via Gitizen) |

---

## 6. Commit Message Guidelines

All git commits must follow the **Conventional Commits** specification:
* `feat(scope): description` - New functionality or endpoint.
* `fix(scope): description` - Bug fix.
* `test(scope): description` - Adding or updating tests.
* `refactor(scope): description` - Code change that neither fixes a bug nor adds a feature.
* `docs(scope): description` - Documentation updates.
* `chore(scope): description` - Tooling, build scripts, or dependency updates.

