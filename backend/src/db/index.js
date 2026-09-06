import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';

fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });

export const db = new Database(env.databasePath);

// WAL keeps reads fast while a write is in flight; foreign keys are off by
// default in SQLite and we rely on ON DELETE CASCADE, so turn them on.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

/** Run a function inside a transaction and return its result. */
export const transaction = (fn) => db.transaction(fn);
