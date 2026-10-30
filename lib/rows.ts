import "server-only";

// Supabase caps individual responses. Financial totals must include every page.
export async function readAll<T>(query: {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data: T[] | null; error: unknown }>;
}): Promise<T[]> {
  const rows: T[] = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const { data, error } = await query.range(offset, offset + size - 1);
    if (error)
      throw new Error("Could not load complete records. Please try again.");
    rows.push(...(data ?? []));
    if (!data || data.length < size) return rows;
  }
}
