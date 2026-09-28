import Redlock from 'redlock';
import { redis } from './redis';

type RedlockClient = ConstructorParameters<typeof Redlock>[0][number];

export const redlock = new Redlock([redis as unknown as RedlockClient], {
  driftFactor: 0.01,
  retryCount: 8, // 8 retries
  retryDelay: 250, // wait ~250ms between retries
  retryJitter: 100, // add random delay to stagger concurrent callers
});
