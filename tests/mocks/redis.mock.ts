import { vi } from 'vitest';

export const redisMockInstance = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  quit: vi.fn().mockResolvedValue('OK'),
  disconnect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  status: 'ready',
};

export class MockRedis {
  get = redisMockInstance.get;
  set = redisMockInstance.set;
  del = redisMockInstance.del;
  quit = redisMockInstance.quit;
  disconnect = redisMockInstance.disconnect;
  on = redisMockInstance.on;
  status = 'ready';
}

export class MockRedlock {
  acquire = vi.fn().mockResolvedValue({
    release: vi.fn().mockResolvedValue(undefined),
    extend: vi.fn().mockResolvedValue(undefined),
  });
  using = vi.fn().mockImplementation(async (_resources: any, _ttl: any, routine: any) => {
    return routine({ release: vi.fn() });
  });
  on = vi.fn();
}

vi.mock('ioredis', () => ({
  default: MockRedis,
  Redis: MockRedis,
}));

vi.mock('redlock', () => ({
  default: MockRedlock,
}));
