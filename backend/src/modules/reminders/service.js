import { addDaysIso, startOfDayIso } from '../../lib/dates.js';
import { applicationRepository } from '../applications/repository.js';
import { serializeApplication } from '../applications/mapper.js';
import { interviewService } from '../interviews/service.js';

const STALE_AFTER_DAYS = 10;

/**
 * The "what should I do today" view. Everything here is derived - there is no
 * reminders table, just applications with a next_action_at and interviews with
 * a date. That keeps a single source of truth.
 */
export const reminderService = {
  digest({ horizonDays = 7, staleDays = STALE_AFTER_DAYS } = {}) {
    const todayStart = startOfDayIso();
    const tomorrowStart = addDaysIso(1, new Date(todayStart));
    const horizonEnd = addDaysIso(horizonDays, new Date(todayStart));

    const due = applicationRepository.dueReminders(horizonEnd).map(serializeApplication);

    const overdue = due.filter((a) => a.nextActionAt < todayStart);
    const today = due.filter((a) => a.nextActionAt >= todayStart && a.nextActionAt < tomorrowStart);
    const upcoming = due.filter((a) => a.nextActionAt >= tomorrowStart);

    const stale = applicationRepository.stale(staleDays).map(serializeApplication);
    const interviews = interviewService.list({ upcoming: true, limit: 20 });

    return {
      overdue,
      today,
      upcoming,
      stale,
      upcomingInterviews: interviews,
      counts: {
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
        stale: stale.length,
        interviews: interviews.length,
      },
    };
  },
};
