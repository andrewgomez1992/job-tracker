/**
 * Wraps a sql.js database in the slice of the better-sqlite3 API the backend
 * uses: prepare().run/get/all, exec, pragma and transaction.
 */
const toValue = (v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v);

const bindArgs = (args) => {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return Object.fromEntries(Object.entries(args[0]).map(([k, v]) => [`@${k}`, toValue(v)]));
  }
  return args.flat().map(toValue);
};

export function wrapDatabase(SQL, bytes) {
  const raw = bytes ? new SQL.Database(bytes) : new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON');
  let depth = 0;

  const prepare = (sql) => {
    const withStatement = (args, fn) => {
      const stmt = raw.prepare(sql);
      try {
        const params = bindArgs(args);
        if (Array.isArray(params) ? params.length : Object.keys(params).length) stmt.bind(params);
        return fn(stmt);
      } finally { stmt.free(); }
    };
    return {
      run: (...args) => withStatement(args, (stmt) => {
        stmt.step();
        const changes = raw.getRowsModified();
        const id = raw.exec('SELECT last_insert_rowid()')[0]?.values[0][0] ?? 0;
        return { changes, lastInsertRowid: id };
      }),
      get: (...args) => withStatement(args, (stmt) => (stmt.step() ? stmt.getAsObject() : undefined)),
      all: (...args) => withStatement(args, (stmt) => {
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      }),
    };
  };

  return {
    raw,
    prepare,
    exec: (sql) => { raw.exec(sql); },
    pragma: (text) => { if (/foreign_keys/i.test(text)) raw.run(`PRAGMA ${text}`); },
    transaction: (fn) => (...args) => {
      if (depth > 0) return fn(...args);
      raw.run('BEGIN');
      depth += 1;
      try {
        const result = fn(...args);
        raw.run('COMMIT');
        return result;
      } catch (error) {
        raw.run('ROLLBACK');
        throw error;
      } finally { depth -= 1; }
    },
    export: () => raw.export(),
  };
}
