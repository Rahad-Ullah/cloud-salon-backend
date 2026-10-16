import { describe, expect, it } from 'vitest';
import { calculateDistance } from './calculateDistance';

describe('calculateDistance Utility', () => {
  it('should return 0 when coordinates are identical', () => {
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
