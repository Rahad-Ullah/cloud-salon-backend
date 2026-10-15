import { describe, expect, it, vi } from 'vitest';
import QueryBuilder from './QueryBuilder';

describe('QueryBuilder Unit Tests', () => {
  const createMockQuery = () => ({
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    model: {
      countDocuments: vi.fn().mockResolvedValue(25),
    },
    getFilter: vi.fn().mockReturnValue({}),
  });

  it('should apply search criteria when searchTerm is present in query', () => {
    const mockQuery = createMockQuery();
    const qb = new QueryBuilder(mockQuery as any, { searchTerm: 'salon' });

    qb.search(['name', 'address.city']);

    expect(mockQuery.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'salon', $options: 'i' } },
        { 'address.city': { $regex: 'salon', $options: 'i' } },
      ],
    });
  });

  it('should filter out pagination, sort, and custom fields from query', () => {
    const mockQuery = createMockQuery();
    const query = {
      searchTerm: 'salon',
      sort: '-createdAt',
      page: '2',
      limit: '10',
      fields: 'name,email',
      role: 'customer',
      status: 'active',
      customIgnore: 'value',
    };
    const qb = new QueryBuilder(mockQuery as any, query);

    qb.filter(['customIgnore']);

    expect(mockQuery.find).toHaveBeenCalledWith({
      role: 'customer',
      status: 'active',
    });
  });

  it('should apply default sort when sort is not provided in query', () => {
    const mockQuery = createMockQuery();
    const qb = new QueryBuilder(mockQuery as any, {});

    qb.sort();

    expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
  });

  it('should apply custom sort when provided in query', () => {
    const mockQuery = createMockQuery();
    const qb = new QueryBuilder(mockQuery as any, { sort: 'price' });

    qb.sort();

    expect(mockQuery.sort).toHaveBeenCalledWith('price');
  });

  it('should apply pagination and calculate skip correctly', () => {
    const mockQuery = createMockQuery();
    const qb = new QueryBuilder(mockQuery as any, { page: '3', limit: '15' });

    qb.paginate();

    expect(mockQuery.skip).toHaveBeenCalledWith(30); // (3 - 1) * 15
    expect(mockQuery.limit).toHaveBeenCalledWith(15);
  });

  it('should format fields for selection or default to -__v', () => {
    const mockQuery = createMockQuery();
    const qb = new QueryBuilder(mockQuery as any, { fields: 'name,email,role' });

    qb.fields();

    expect(mockQuery.select).toHaveBeenCalledWith('name email role');
  });

  it('should compute pagination meta information correctly', async () => {
    const mockQuery = createMockQuery();
    const qb = new QueryBuilder(mockQuery as any, { page: '2', limit: '10' });

    const meta = await qb.getPaginationInfo();

    expect(meta).toEqual({
      total: 25,
      limit: 10,
      page: 2,
      totalPage: 3,
    });
  });
});
