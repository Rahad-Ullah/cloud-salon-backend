import { describe, expect, it } from 'vitest';
import generateOTP from './generateOTP';

describe('generateOTP Utility', () => {
  it('should generate a 4-digit OTP within range 1000 - 9999', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOTP(4);
      expect(otp).toBeGreaterThanOrEqual(1000);
      expect(otp).toBeLessThanOrEqual(9999);
    }
  });

  it('should generate a 6-digit OTP within range 100000 - 999999', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOTP(6);
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThanOrEqual(999999);
    }
  });
});
