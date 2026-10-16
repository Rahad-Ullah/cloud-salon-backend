import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { objectId } from './objectIdValidator';

describe('objectIdValidator Shared Utility', () => {
  const validator = objectId('Salon ID');

  it('should pass on valid 24-character hexadecimal ObjectId', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const result = validator.safeParse(validId);
    expect(result.success).toBe(true);
  });

  it('should fail with descriptive error message on invalid ObjectId', () => {
    const result = validator.safeParse('12345-invalid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('must be a valid object id');
    }
  });
});
