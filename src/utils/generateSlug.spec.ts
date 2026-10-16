import { describe, expect, it } from 'vitest';
import { generateSlug } from './generateSlug';
import ApiError from '../errors/ApiError';

describe('generateSlug Utility', () => {
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
