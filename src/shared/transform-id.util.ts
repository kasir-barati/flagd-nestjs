/**
 * Transforms a MongoDB document (with `_id`) or a SQL record (with `id`)
 * into a normalized object with a string `id` field.
 */
export function transformToId<T extends Record<string, unknown>>(
  record: T,
): Omit<T, '_id'> & { id: string } {
  const { _id, id, ...rest } = record;
  const normalizedId = (_id ?? id) as string;

  return { ...rest, id: String(normalizedId) } as Omit<T, '_id'> & {
    id: string;
  };
}
