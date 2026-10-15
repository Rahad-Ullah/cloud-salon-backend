import { describe, expect, it } from 'vitest';
import { Professional } from './professional.model';

describe('Professional Model Unit Tests', () => {
  describe('Professional.isProfileFulfilled', () => {
    const completeProfile = {
      title: 'Senior Hair Stylist',
      quote: 'Making you look your best',
      bio: 'Over 8 years of experience in modern salon styling.',
      experienceYears: 8,
      startingPriceInUSD: 45,
      specialties: ['Haircut', 'Coloring'],
      photos: ['https://cloudsalon.com/portfolio1.jpg'],
    };

    it('should return false if professional object is empty or undefined', () => {
      expect(Professional.isProfileFulfilled({} as any)).toBe(false);
      expect(Professional.isProfileFulfilled(undefined as any)).toBe(false);
    });

    it('should return false if basic details (title, quote, bio) are missing or blank', () => {
      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          title: '',
        }),
      ).toBe(false);

      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          quote: '   ',
        }),
      ).toBe(false);

      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          bio: undefined,
        }),
      ).toBe(false);
    });

    it('should return false if startingPriceInUSD is zero or undefined', () => {
      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          startingPriceInUSD: 0,
        }),
      ).toBe(false);

      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          startingPriceInUSD: undefined,
        }),
      ).toBe(false);
    });

    it('should return false if specialties list is empty', () => {
      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          specialties: [],
        }),
      ).toBe(false);
    });

    it('should return false if photos list is empty', () => {
      expect(
        Professional.isProfileFulfilled({
          ...completeProfile,
          photos: [],
        }),
      ).toBe(false);
    });

    it('should return true when all profile fulfillment criteria are satisfied', () => {
      expect(Professional.isProfileFulfilled(completeProfile)).toBe(true);
    });
  });
});
