#!/usr/bin/env node
/**
 * Dead-posting checker.
 *
 * Job boards pull listings without telling anyone, so a role can sit on the
 * board for weeks after it stopped existing. This pings every tracked job_url
 * and reports the ones that are gone.
 *
 *   node scripts/check-links.mjs          # report only
 *   node scripts/check-links.mjs --fix    # also archive dead 'saved' rows
 *   node scripts/check-links.mjs --all    # include already-archived rows
 *
 * Rows past 'saved' are never auto-changed: a pulled posting does not mean you
 * are out of a pipeline you are already in. Those are reported for you to judge.
 */
import Database from 'better-sqlite3';
import { env } from '../src/config/env.js';

const FIX = process.argv.includes('--fix');
const INCLUDE_ARCHIVED = process.argv.includes('--all');

const CONCURRENCY = 6;
const TIMEOUT_MS = 15_000;

/** Phrases boards put on a pulled listing. Matched against the page body. */
const GONE_PHRASES = [
  'no longer open',
  'no longer available',
  'no longer accepting applications',
  'position has been filled',
  'job is closed',
  'this job has been closed',
  'posting is closed',
  'job not found',
  'page not found',
];

/**
 * Most boards keep the job id in the path. When a listing is pulled they
 * redirect to the board root (Greenhouse adds ?error=true), so losing the id
 * from the final URL is a reliable "gone" signal that needs no body parsing.
 */
const idFromUrl = (url) => {
  const m = String(url).match(/\/(?:jobs|job|p|postings)\/([A-Za-z0-9-]{4,})/);
  return m ? m[1] : null;
};

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Some boards serve a stub to unknown agents.
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (res.status === 404 || res.status === 410) {
      return { state: 'GONE', why: `HTTP ${res.status}` };
    }
    if (!res.ok) {
      return { state: 'UNKNOWN', why: `HTTP ${res.status}` };
    }

    const wantedId = idFromUrl(url);
    const landedId = idFromUrl(res.url);
    if (wantedId && landedId !== wantedId) {
      return { state: 'GONE', why: `redirected off the listing (${new URL(res.url).pathname}${new URL(res.url).search})` };
    }

    const body = (await res.text()).toLowerCase();
    const hit = GONE_PHRASES.find((p) => body.includes(p));
    if (hit) return { state: 'GONE', why: `page says "${hit}"` };

    return { state: 'LIVE', why: `HTTP ${res.status}` };
  } catch (err) {
    const why = err.name === 'AbortError' ? `timed out after ${TIMEOUT_MS / 1000}s` : err.message;
    return { state: 'UNKNOWN', why };
  } finally {
    clearTimeout(timer);
  }
}

/** Run checks with a small pool so we are not hammering one board. */
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const db = new Database(env.databasePath);
db.pragma('journal_mode = WAL');

const rows = db
  .prepare(
    `SELECT a.id, a.status, a.archived, a.job_url, a.notes, c.name AS company, a.role
       FROM applications a
       LEFT JOIN companies c ON c.id = a.company_id
      WHERE a.job_url IS NOT NULL AND trim(a.job_url) <> ''
        ${INCLUDE_ARCHIVED ? '' : 'AND a.archived = 0'}
      ORDER BY a.id`,
  )
  .all();

if (rows.length === 0) {
  console.log('No tracked jobs have a URL to check.');
  process.exit(0);
}

console.log(`Checking ${rows.length} posting${rows.length === 1 ? '' : 's'}…\n`);

const results = await mapPool(rows, CONCURRENCY, async (row) => ({
  ...row,
  ...(await check(row.job_url)),
}));

const gone = results.filter((r) => r.state === 'GONE');
const unknown = results.filter((r) => r.state === 'UNKNOWN');
const live = results.filter((r) => r.state === 'LIVE');

const label = (r) => `#${r.id} ${r.company} — ${r.role}`;

if (gone.length) {
  console.log(`GONE (${gone.length}) — these postings have been pulled:`);
  for (const r of gone) console.log(`  ${label(r)}\n      ${r.why}\n      ${r.job_url}`);
  console.log('');
}
if (unknown.length) {
  console.log(`COULD NOT TELL (${unknown.length}) — check these by hand:`);
  for (const r of unknown) console.log(`  ${label(r)}\n      ${r.why}`);
  console.log('');
}
console.log(`LIVE: ${live.length}   GONE: ${gone.length}   UNKNOWN: ${unknown.length}`);

if (!FIX) {
  const fixable = gone.filter((r) => r.status === 'saved').length;
  if (fixable) {
    console.log(`\nRe-run with --fix to archive the ${fixable} dead job${fixable === 1 ? '' : 's'} you had not applied to yet.`);
  }
  process.exit(0);
}

/* --fix: only touch rows still at 'saved'. A pulled posting for a job you have
   already applied to is news, not a reason to close your own pipeline. */
const stamp = new Date().toISOString().slice(0, 10);
const update = db.prepare(
  `UPDATE applications
      SET archived = 1,
          notes = CASE WHEN notes IS NULL OR trim(notes) = ''
                       THEN @note ELSE notes || char(10) || @note END,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = @id`,
);

const toArchive = gone.filter((r) => r.status === 'saved');
const skipped = gone.filter((r) => r.status !== 'saved');

const run = db.transaction((list) => {
  for (const r of list) update.run({ id: r.id, note: `[${stamp}] Posting pulled — ${r.why}. Archived automatically.` });
});
run(toArchive);

console.log(`\nArchived ${toArchive.length} dead saved job${toArchive.length === 1 ? '' : 's'}.`);
for (const r of toArchive) console.log(`  ${label(r)}`);
if (skipped.length) {
  console.log(`\nLeft alone (already applied — your call):`);
  for (const r of skipped) console.log(`  ${label(r)} [${r.status}]`);
}

db.close();
