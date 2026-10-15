import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Load all external service mocks before any app code runs
import './mocks/bullmq.mock';
import './mocks/redis.mock';
import './mocks/elastic.mock';
import './mocks/nodemailer.mock';
import './mocks/s3.mock';
import './mocks/stripe.mock';
import './mocks/gemini.mock';

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  // Set required test env vars if not set
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
  process.env.JWT_EXPIRE_IN = process.env.JWT_EXPIRE_IN || '1h';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_12345';
  process.env.JWT_REFRESH_EXPIRE_IN =
    process.env.JWT_REFRESH_EXPIRE_IN || '30d';
  process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '10';

  // Start ephemeral in-memory MongoDB Replica Set to support transactions
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
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
  // Gracefully terminate database connections
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

