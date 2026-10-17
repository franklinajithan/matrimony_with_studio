/** Collect every privacy-safe page before ranking/filtering; never silently truncate to 500. */
export async function loadDirectory<T>(
  page: (offset: number, limit: number) => Promise<T[]>,
  signal: AbortSignal,
  maximum = 10000,
) {
  const rows: T[] = [];
  for (let offset = 0; offset <= maximum; offset += 100) {
    signal.throwIfAborted();
    const next = await page(offset, 100);
    signal.throwIfAborted();
    if (rows.length + next.length > maximum) break;
    rows.push(...next);
    if (next.length < 100) return rows;
  }
  throw new Error(
    "The directory is too large to load safely. Contact support for assistance.",
  );
}
