import { transformToId } from './transform-id.util.js';

describe('transformToId', () => {
  it('should normalize a SQL record with `id`', () => {
    const record = { id: 'uuid-1', name: 'test' };

    const result = transformToId(record);

    expect(result).toEqual({ id: 'uuid-1', name: 'test' });
  });

  it('should normalize a MongoDB document with `_id`', () => {
    const record = { _id: 'mongo-id-123', name: 'test' };

    const result = transformToId(record);

    expect(result).toEqual({ id: 'mongo-id-123', name: 'test' });
  });

  it('should prefer `_id` over `id` when both are present', () => {
    const record = { _id: 'mongo-id', id: 'sql-id', name: 'test' };

    const result = transformToId(record);

    expect(result).toEqual({ id: 'mongo-id', name: 'test' });
  });

  it('should stringify non-string ids', () => {
    const record = { _id: 12345, name: 'test' };

    const result = transformToId(record as any);

    expect(result.id).toBe('12345');
  });
});
