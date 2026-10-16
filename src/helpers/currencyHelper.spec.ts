import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { CurrencyHelper } from './currencyHelper';

describe('CurrencyHelper', () => {
  it('should fetch exchange rate and perform conversion', async () => {
    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        base: 'USD',
        rates: { EUR: 0.92, GBP: 0.78 },
      },
    });

    const converted = await CurrencyHelper.convert(100, 'USD', 'EUR');
    expect(converted).toBe(92);
  });

  it('should return null when conversion fails due to network error', async () => {
    vi.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Network error'));

    const result = await CurrencyHelper.convert(100, 'USD', 'JPY');
    expect(result).toBeNull();
  });
});
