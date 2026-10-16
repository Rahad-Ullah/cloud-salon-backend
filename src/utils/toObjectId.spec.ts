import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { toObjectId } from './toObjectId';
import ApiError from '../errors/ApiError';

describe('toObjectId Utility', () => {
  it('should convert valid 24-character hex string into ObjectId', () => {
    const validHex = '507f1f77bcf86cd799439011';
    const objId = toObjectId(validHex);
    expect(objId).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(objId.toString()).toBe(validHex);
  });

  it('should throw ApiError 400 when invalid id is passed', () => {
    expect(() => toObjectId('invalid-id')).toThrow(ApiError);
    expect(() => toObjectId('123')).toThrow(ApiError);
    expect(() => toObjectId(null)).toThrow(ApiError);
  });
});
