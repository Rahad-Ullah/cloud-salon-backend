import { vi } from 'vitest';

export const queueAddSpy = vi.fn().mockResolvedValue({ id: 'mock-job-id' });

export class MockQueue {
  add = queueAddSpy;
  close = vi.fn().mockResolvedValue(undefined);
}

export class MockWorker {
  on = vi.fn();
  close = vi.fn().mockResolvedValue(undefined);
}

export class MockQueueEvents {
  on = vi.fn();
  close = vi.fn().mockResolvedValue(undefined);
}

export class MockJob {
  id = 'mock-job-id';
  data = {};
  updateProgress = vi.fn().mockResolvedValue(undefined);
}

vi.mock('bullmq', () => ({
  Queue: MockQueue,
  Worker: MockWorker,
  QueueEvents: MockQueueEvents,
  Job: MockJob,
}));
