import { describe, expect, it } from 'vitest';
import { jwtHelper } from './jwtHelper';

describe('jwtHelper', () => {
  const testSecret = 'super_secret_test_key_for_jwt_unit_tests';
  const payload = { id: 'user_123', role: 'customer' };

  it('should create and verify a valid JWT token', () => {
    const token = jwtHelper.createToken(payload, testSecret, '1h');
    expect(token).toBeTypeOf('string');

    const decoded = jwtHelper.verifyToken(token, testSecret);
    expect(decoded.id).toBe('user_123');
    expect(decoded.role).toBe('customer');
  });

  it('should throw error when verifying with wrong secret', () => {
    const token = jwtHelper.createToken(payload, testSecret, '1h');
    expect(() => jwtHelper.verifyToken(token, 'wrong_secret')).toThrow();
  });
});
