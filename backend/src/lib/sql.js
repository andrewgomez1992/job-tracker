/**
 * Small helpers for hand-written SQL. We deliberately avoid an ORM: the schema
 * is small, the queries are readable, and better-sqlite3 is synchronous.
 */

/** Build a `SET a = ?, b = ?` clause from a whitelist of updatable columns. */
export function buildUpdate(patch, allowedColumns) {
  const columns = allowedColumns.filter((c) => patch[c] !== undefined);
  if (columns.length === 0) return null;
  return {
    clause: columns.map((c) => `${c} = @${c}`).join(', '),
    params: Object.fromEntries(columns.map((c) => [c, patch[c]])),
  };
}

/** Turn `undefined` into `null` so better-sqlite3 accepts named parameters. */
export const nullish = (value) => (value === undefined ? null : value);

/** Normalise an object's undefined values to null for a given key list. */
export const withNulls = (obj, keys) =>
  Object.fromEntries(keys.map((k) => [k, nullish(obj[k])]));

/** SQLite has no booleans. */
export const toBool = (value) => value === 1 || value === true;
export const toInt = (value) => (value ? 1 : 0);

/** Escape a user string for use inside a LIKE pattern. */
export const likeTerm = (term) => `%${String(term).replace(/[%_\\]/g, '\\$&')}%`;
