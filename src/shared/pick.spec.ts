import { describe, expect, it } from 'vitest';
import pick from './pick';

describe('pick Shared Utility', () => {
  it('should pick only specified keys from an object', () => {
    const source = {
      name: 'Cloud Salon',
      city: 'New York',
      rating: 4.8,
      active: true,
    };

    const picked = pick(source, ['name', 'rating']);
    expect(picked).toEqual({ name: 'Cloud Salon', rating: 4.8 });
  });

  it('should ignore keys that do not exist on the source object', () => {
    const source = { name: 'Salon' };
    // @ts-ignore
    const picked = pick(source, ['name', 'nonExistent']);
    expect(picked).toEqual({ name: 'Salon' });
  });
});
