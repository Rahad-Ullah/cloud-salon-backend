import { describe, expect, it } from 'vitest';
import cryptoToken from './cryptoToken';

describe('cryptoToken Utility', () => {
  it('should return a 64-character hexadecimal string', () => {
    const token = cryptoToken();
    expect(token).toBeTypeOf('string');
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate unique tokens on consecutive calls', () => {
    const token1 = cryptoToken();
    const token2 = cryptoToken();
    expect(token1).not.toBe(token2);
  });
});
