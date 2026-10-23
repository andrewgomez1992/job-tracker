/** Browser stand-in for backend/src/db/migrate.js: same SQL files, bundled at build time. */
import { db } from './db.js';

const files = import.meta.glob('../../../../backend/src/db/migrations/*.sql', {
  query: '?raw', import: 'default', eager: true,
});

export function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );`);
  const applied = new Set(db.prepare('SELECT name FROM _migrations').all().map((r) => r.name));
  const pending = Object.keys(files).sort()
    .map((path) => ({ name: path.split('/').pop(), sql: files[path] }))
    .filter((f) => !applied.has(f.name));
  const record = db.prepare('INSERT INTO _migrations (name) VALUES (?)');
  for (const file of pending) {
    db.transaction(() => { db.exec(file.sql); record.run(file.name); })();
  }
  return { applied: pending.map((f) => f.name) };
}
