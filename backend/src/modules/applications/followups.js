import { AUTO_FOLLOWUPS, AUTO_FOLLOW_UP, AUTO_REACH_OUT } from '../../lib/constants.js';

const AUTO = new Set([AUTO_REACH_OUT, AUTO_FOLLOW_UP]);

/** A date `days` from `from`, at 9am local. */
const at9 = (days, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
};

/**
 * Decide what reminder a change should leave behind. Mutates `row` (the
 * DB-shaped patch). `current` is the row before the change, or null on create.
 */
export function applyAutoFollowups(row, current = null) {
  if (!AUTO_FOLLOWUPS) return row;

  const status = row.status ?? current?.status;
  const nextAt = row.next_action_at !== undefined ? row.next_action_at : current?.next_action_at;
  const nextText = row.next_action !== undefined ? row.next_action : current?.next_action;
  const becameApplied = status === 'applied' && (!current || current.status !== 'applied');

  // 1. Just applied and nothing scheduled: reach out in 2 days.
  if (becameApplied && !nextAt) {
    row.next_action = AUTO_REACH_OUT;
    row.next_action_at = at9(2);
    return row;
  }

  // 2. Cleared the reach-out while still waiting: follow up a week after applying.
  if (current && status === 'applied' && current.next_action === AUTO_REACH_OUT
      && row.next_action_at === null) {
    const appliedAt = new Date(row.applied_at ?? current.applied_at ?? Date.now());
    const week = new Date(at9(7, appliedAt));
    const soonest = new Date(at9(3));
    row.next_action = AUTO_FOLLOW_UP;
    row.next_action_at = (week > soonest ? week : soonest).toISOString();
    return row;
  }

  // 3. They replied (or it closed): drop any auto reminder that no longer applies.
  if (current && row.status && row.status !== 'applied' && row.status !== current.status
      && AUTO.has(nextText) && row.next_action_at === undefined) {
    row.next_action = null;
    row.next_action_at = null;
  }
  return row;
}
