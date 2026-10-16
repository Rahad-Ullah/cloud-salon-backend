import { describe, expect, it } from 'vitest';
import { timeAgo } from './timeAgo';

describe('timeAgo Utility', () => {
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
