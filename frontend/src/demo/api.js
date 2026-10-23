/**
 * The browser demo's "server". It loads SQLite (WebAssembly), runs the real
 * backend migrations, seeds the fake data and then answers API calls with the
 * backend's own Express routes, validation and services.
 * Changes are saved to this browser's localStorage only.
 */
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { ApiError } from '../api/client.js';
import { wrapDatabase } from './sqlite.js';
import { setDatabase } from './shims/db.js';

const STORAGE_KEY = 'trail.demo.db.v1';
let booting = null;
let database = null;

const load = () => {
  try {
    const b64 = localStorage.getItem(STORAGE_KEY);
    if (!b64) return null;
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } catch { return null; }
};

const persist = () => {
  try {
    const bytes = database.export();
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    localStorage.setItem(STORAGE_KEY, btoa(bin));
  } catch { /* storage full or blocked: the demo still works for this visit */ }
};

export const resetDemo = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  window.location.reload();
};

async function boot() {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const saved = load();
  database = wrapDatabase(SQL, saved);
  setDatabase(database);

  const { runMigrations } = await import('./shims/migrate.js');
  runMigrations();
  const empty = database.prepare('SELECT COUNT(*) AS n FROM applications').get().n === 0;
  if (empty) {
    const { seedDatabase } = await import('../../../backend/src/db/seed.js');
    seedDatabase();
    persist();
  }
  const { apiRouter } = await import('../../../backend/src/routes.js');
  return apiRouter;
}

const stringify = (params = {}) => Object.fromEntries(
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)]),
);

export async function demoRequest(method, path, { body, params } = {}) {
  booting ??= boot();
  const router = await booting;

  const [pathname, search] = path.split('?');
  const query = { ...Object.fromEntries(new URLSearchParams(search ?? '')), ...stringify(params) };
  const parsedBody = body instanceof FormData
    ? Object.fromEntries([...body.entries()].filter(([, v]) => typeof v === 'string'))
    : body ? JSON.parse(JSON.stringify(body)) : {};

  const req = { method, path: pathname, originalUrl: path, query, body: parsedBody, params: {}, headers: {} };
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; this.onFinish?.(); return this; },
    end() { this.onFinish?.(); return this; },
    download() { throw Object.assign(new Error('File downloads are not available in the demo.'), { status: 501 }); },
  };

  try {
    const matched = await router.handle(req, res, pathname);
    if (!matched) throw Object.assign(new Error('Not found'), { status: 404 });
  } catch (error) {
    throw new ApiError(error?.message || 'Something went wrong', { status: error?.status ?? 500, details: error?.details });
  }

  if (method !== 'GET') persist();
  if (res.statusCode === 204) return null;
  return res.body?.data ?? null;
}
