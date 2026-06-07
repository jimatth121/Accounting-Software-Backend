// Generic list pagination + free-text search for table endpoints.
//
// Reads `page` (default 1), `pageSize`/`limit` (default 10, max 100) and
// `search`/`q` from the query string. Route-specific filters (status, date
// range, etc.) should be applied to `rows` BEFORE calling this so paging and
// totals reflect the filtered set.
//
// Returns: { data, page, pageSize, total, totalPages, hasMore }
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function valueAt(row, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), row);
}

export function paginate(rows, query = {}, searchFields = []) {
  let filtered = Array.isArray(rows) ? rows : [];

  const term = String(query.search ?? query.q ?? "").trim().toLowerCase();
  if (term && searchFields.length) {
    filtered = filtered.filter((row) =>
      searchFields.some((field) => String(valueAt(row, field) ?? "").toLowerCase().includes(term))
    );
  }

  const total = filtered.length;

  const rawSize = parseInt(query.pageSize ?? query.limit, 10);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isFinite(rawSize) ? rawSize : DEFAULT_PAGE_SIZE)
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const rawPage = parseInt(query.page, 10);
  const page = Math.min(totalPages, Math.max(1, Number.isFinite(rawPage) ? rawPage : 1));

  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, page, pageSize, total, totalPages, hasMore: page < totalPages };
}
