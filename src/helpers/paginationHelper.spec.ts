import { describe, expect, it } from 'vitest';
import { paginationHelper } from './paginationHelper';

describe('paginationHelper', () => {
  it('should provide sensible defaults when options are empty', () => {
    const result = paginationHelper.calculatePagination({});
    expect(result).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('should correctly calculate skip and pagination for custom values', () => {
    const result = paginationHelper.calculatePagination({
      page: 4,
      limit: 20,
      sortBy: 'price',
      sortOrder: 'asc',
    });

    expect(result).toEqual({
      page: 4,
      limit: 20,
      skip: 60, // (4 - 1) * 20
      sortBy: 'price',
      sortOrder: 'asc',
    });
  });
});
