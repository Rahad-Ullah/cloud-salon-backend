import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { calculateDistance } from '../../src/utils/calculateDistance';
import cryptoToken from '../../src/utils/cryptoToken';
import generateOTP from '../../src/utils/generateOTP';
import { generateSlug } from '../../src/utils/generateSlug';
import { timeAgo } from '../../src/utils/timeAgo';
import { toObjectId } from '../../src/utils/toObjectId';
import ApiError from '../../src/errors/ApiError';

describe('Utility Functions Unit Tests', () => {
  describe('calculateDistance', () => {
    it('should return 0 when two coordinates are identical', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should calculate accurate distance between two cities (NYC to London ~ 5570 km)', () => {
      const nyc = { lat: 40.7128, lon: -74.006 };
      const london = { lat: 51.5074, lon: -0.1278 };

      const distance = calculateDistance(nyc.lat, nyc.lon, london.lat, london.lon);
      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5600);
    });

    it('should round result to 2 decimal places', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7306, -73.9352);
      expect(distance.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });
  });

  describe('cryptoToken', () => {
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

  describe('generateOTP', () => {
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

  describe('generateSlug', () => {
    it('should generate lowercased, hyphen-separated slug', () => {
      const slug = generateSlug('Master Hair Cut & Beard Trim');
      expect(slug).toBe('master-hair-cut-beard-trim');
    });

    it('should collapse multiple dashes and remove leading/trailing dashes', () => {
      const slug = generateSlug('  ---Super   Salon---  Styling  ');
      expect(slug).toBe('super-salon-styling');
    });

    it('should preserve unicode and multilingual characters', () => {
      const slug = generateSlug('চুল কাটার সেলুন Salon 2026');
      expect(slug).toContain('চুল-কাটার-সেলুন-salon-2026');
    });

    it('should throw ApiError with 400 when title is empty or invalid', () => {
      expect(() => generateSlug('')).toThrow(ApiError);
      expect(() => generateSlug('   ')).toThrow(ApiError);
      // @ts-ignore
      expect(() => generateSlug(null)).toThrow(ApiError);
    });
  });

  describe('timeAgo', () => {
    it('should return seconds ago for recent dates', () => {
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5000);
      expect(timeAgo(fiveSecondsAgo)).toMatch(/\d+ seconds? ago/);
    });

    it('should return minutes ago for date within an hour', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(timeAgo(tenMinutesAgo)).toBe('10 minutes ago');

      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(timeAgo(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('should return hours ago for date within a day', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(timeAgo(twoHoursAgo)).toBe('2 hours ago');

      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(timeAgo(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return days ago for date within a month', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(timeAgo(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return months ago for date within a year', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000);
      expect(timeAgo(twoMonthsAgo)).toBe('2 months ago');
    });

    it('should return years ago for dates over a year', () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getTime() - 750 * 24 * 60 * 60 * 1000);
      expect(timeAgo(twoYearsAgo)).toBe('2 years ago');
    });
  });

  describe('toObjectId', () => {
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
});
