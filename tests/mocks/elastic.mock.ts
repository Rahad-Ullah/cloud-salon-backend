import { vi } from 'vitest';

export const elasticSearchMock = {
  index: vi.fn().mockResolvedValue({ result: 'created' }),
  search: vi.fn().mockResolvedValue({ hits: { hits: [], total: { value: 0 } } }),
  update: vi.fn().mockResolvedValue({ result: 'updated' }),
  delete: vi.fn().mockResolvedValue({ result: 'deleted' }),
  close: vi.fn().mockResolvedValue(undefined),
};

export class MockElasticClient {
  index = elasticSearchMock.index;
  search = elasticSearchMock.search;
  update = elasticSearchMock.update;
  delete = elasticSearchMock.delete;
  close = elasticSearchMock.close;
}

vi.mock('../../src/config/elastic-search', () => ({
  elasticSearch: elasticSearchMock,
}));

vi.mock('@elastic/elasticsearch', () => ({
  Client: MockElasticClient,
}));
