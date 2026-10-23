import { db } from '../../db/index.js';

/** Local YYYY-MM-DD for a date. */
const dayKey = (d) => {
  // Date-only values ("2026-10-22") are already a local day; don't shift them through UTC.
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

/**
 * Applications per day, plus the current and best streak. A streak is
 * consecutive days with at least one application; weekends with nothing
 * don't break it, and today doesn't break it until it's over.
 */
export function dailyActivity({ days = 60 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - 400);
  const rows = db.prepare('SELECT applied_at FROM applications WHERE applied_at IS NOT NULL AND applied_at >= ?')
    .all(since.toISOString());

  const counts = new Map();
  for (const { applied_at: at } of rows) counts.set(dayKey(at), (counts.get(dayKey(at)) ?? 0) + 1);

  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Current streak, walking back from today.
  let streak = 0;
  for (let i = 0; i < 400; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const n = counts.get(dayKey(d)) ?? 0;
    if (n > 0) streak += 1;
    else if (i === 0 || isWeekend(d)) continue;
    else break;
  }

  // Best streak over the window.
  let best = 0;
  let run = 0;
  for (let i = 399; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const n = counts.get(dayKey(d)) ?? 0;
    if (n > 0) { run += 1; best = Math.max(best, run); } else if (!isWeekend(d)) run = 0;
  }

  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    series.push({ date: dayKey(d), count: counts.get(dayKey(d)) ?? 0 });
  }

  return { today: counts.get(dayKey(today)) ?? 0, streak, best: Math.max(best, streak), days: series };
}
