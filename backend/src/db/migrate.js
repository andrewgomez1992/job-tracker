import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './index.js';
import { logger } from '../lib/logger.js';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * Forward-only migration runner. Each .sql file in ./migrations runs once,
 * in filename order, inside a transaction, and is recorded in _migrations.
 */
export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  const applied = new Set(db.prepare('SELECT name FROM _migrations').all().map((r) => r.name));
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) return { applied: [] };

  const record = db.prepare('INSERT INTO _migrations (name) VALUES (?)');
  const apply = db.transaction((file) => {
    db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    record.run(file);
  });

  for (const file of pending) {
    apply(file);
    logger.info(`migration applied: ${file}`);
  }

  return { applied: pending };
}
