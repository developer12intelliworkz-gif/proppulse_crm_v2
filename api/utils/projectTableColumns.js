let columnCache = null;
let columnCacheAt = 0;
const CACHE_MS = 60_000;

export async function getProjectTableColumns(client) {
  const now = Date.now();
  if (columnCache && now - columnCacheAt < CACHE_MS) {
    return columnCache;
  }
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'projects'`,
  );
  columnCache = new Set(result.rows.map((row) => row.column_name));
  columnCacheAt = now;
  return columnCache;
}

export function clearProjectColumnCache() {
  columnCache = null;
  columnCacheAt = 0;
}
