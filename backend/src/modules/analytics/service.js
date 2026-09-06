import {
  ACTIVE_STATUSES, APPLICATION_STATUSES, FUNNEL_STAGES, RESPONDED_STATUSES,
} from '../../lib/constants.js';
import { daysBetween } from '../../lib/dates.js';
import { analyticsRepository } from './repository.js';

/** Monday-anchored week key, e.g. 2026-08-31. */
const weekKey = (isoDate) => {
  const d = new Date(isoDate);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

/**
 * Build, for every application, the set of statuses it has EVER held.
 * The board only stores the current status, so a rejected candidate would
 * otherwise vanish from the "reached interview" count.
 */
function buildHistory(applications, changes) {
  const history = new Map(applications.map((a) => [a.id, new Set([a.status])]));
  for (const change of changes) {
    const set = history.get(change.application_id);
    if (!set) continue;
    if (change.from_status) set.add(change.from_status);
    if (change.to_status) set.add(change.to_status);
  }
  // Anything that left 'saved' was, by definition, applied to.
  for (const app of applications) {
    const set = history.get(app.id);
    if (app.applied_at || app.status !== 'saved') set.add('applied');
  }
  return history;
}

function firstResponseAt(changes) {
  const map = new Map();
  for (const change of changes) {
    if (!RESPONDED_STATUSES.includes(change.to_status)) continue;
    if (!map.has(change.application_id)) map.set(change.application_id, change.occurred_at);
  }
  return map;
}

export const analyticsService = {
  overview({ weeks = 12 } = {}) {
    const applications = analyticsRepository.applications();
    const changes = analyticsRepository.statusChanges();
    const history = buildHistory(applications, changes);
    const responses = firstResponseAt(changes);

    const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
    for (const app of applications) byStatus[app.status] += 1;

    const everApplied = applications.filter((a) => history.get(a.id).has('applied'));
    const everResponded = everApplied.filter((a) =>
      RESPONDED_STATUSES.some((s) => history.get(a.id).has(s)));
    const everInterviewed = everApplied.filter((a) => history.get(a.id).has('interviewing'));
    const everOffered = everApplied.filter((a) => history.get(a.id).has('offer'));

    const funnel = FUNNEL_STAGES.map((stage) => {
      const count = applications.filter((a) =>
        stage.reaches.some((s) => history.get(a.id).has(s))).length;
      return { key: stage.key, label: stage.label, count };
    });

    // Weekly application volume for the sparkline / bar chart.
    const buckets = new Map();
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const d = new Date(cursor);
      d.setDate(d.getDate() - i * 7);
      buckets.set(weekKey(d.toISOString()), 0);
    }
    for (const app of everApplied) {
      const key = weekKey(app.applied_at || app.created_at);
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
    }

    // Days from applying to the first sign of life.
    const responseTimes = everApplied
      .map((a) => daysBetween(a.applied_at || a.created_at, responses.get(a.id)))
      .filter((n) => n != null && n >= 0);
    const avgResponseDays = responseTimes.length
      ? Math.round((responseTimes.reduce((sum, n) => sum + n, 0) / responseTimes.length) * 10) / 10
      : null;

    // Which sources actually produce replies.
    const sourceMap = new Map();
    for (const app of everApplied) {
      const key = app.source?.trim() || 'Unspecified';
      const entry = sourceMap.get(key) || { source: key, applications: 0, responses: 0 };
      entry.applications += 1;
      if (RESPONDED_STATUSES.some((s) => history.get(app.id).has(s))) entry.responses += 1;
      sourceMap.set(key, entry);
    }
    const sources = [...sourceMap.values()]
      .map((s) => ({ ...s, responseRate: percent(s.responses, s.applications) }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 8);

    const interviewOutcomes = analyticsRepository.interviewCounts();

    return {
      totals: {
        tracked: applications.length,
        active: applications.filter((a) => !a.archived && ACTIVE_STATUSES.includes(a.status)).length,
        applied: everApplied.length,
        interviewing: everInterviewed.length,
        offers: everOffered.length,
        archived: applications.filter((a) => a.archived).length,
      },
      byStatus,
      funnel,
      rates: {
        response: percent(everResponded.length, everApplied.length),
        interview: percent(everInterviewed.length, everApplied.length),
        offer: percent(everOffered.length, everApplied.length),
      },
      avgResponseDays,
      weekly: [...buckets.entries()].map(([week, count]) => ({ week, count })),
      sources,
      interviewOutcomes: Object.fromEntries(interviewOutcomes.map((r) => [r.outcome, r.count])),
    };
  },
};
