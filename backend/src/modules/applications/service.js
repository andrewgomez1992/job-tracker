import { ApiError } from '../../lib/ApiError.js';
import { db } from '../../db/index.js';
import { nowIso } from '../../lib/dates.js';
import { APPLICATION_STATUSES } from '../../lib/constants.js';
import { activityService } from '../activities/service.js';
import { companyService } from '../companies/service.js';
import { applicationRepository } from './repository.js';
import { serializeApplication, toApplicationRow } from './mapper.js';

const STATUS_LABELS = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interviewing: 'Interviewing',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

/** Resolve companyId from either an explicit id or a (possibly new) name. */
const resolveCompanyId = ({ companyId, companyName }) => {
  if (companyId) {
    companyService.get(companyId); // throws 404 if it does not exist
    return companyId;
  }
  return companyService.resolveByName(companyName).id;
};

export const applicationService = {
  list: (filters) => applicationRepository.list(filters).map(serializeApplication),

  board() {
    const rows = applicationRepository.board().map(serializeApplication);
    const columns = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, []]));
    for (const row of rows) columns[row.status].push(row);
    return columns;
  },

  get(id) {
    const row = applicationRepository.findById(id);
    if (!row) throw ApiError.notFound('Application');
    return serializeApplication(row);
  },

  create(payload) {
    const run = db.transaction(() => {
      const companyId = resolveCompanyId(payload);
      const row = toApplicationRow({ ...payload, companyId });

      // Applying is a dated event; remember when, even if you forgot to say.
      if (row.status !== 'saved' && !row.applied_at) row.applied_at = nowIso();

      const created = applicationRepository.create(row);
      activityService.record({
        applicationId: created.id,
        type: 'created',
        message: `Added ${created.role} at ${created.company_name}`,
        payload: { status: created.status },
      });
      return created;
    });

    return serializeApplication(run());
  },

  update(id, patch) {
    const current = applicationRepository.findById(id);
    if (!current) throw ApiError.notFound('Application');

    const run = db.transaction(() => {
      const next = { ...patch };
      if (patch.companyId || patch.companyName) {
        next.companyId = resolveCompanyId(patch);
      }

      const row = toApplicationRow(next);

      if (row.status && row.status !== current.status) {
        if (row.status !== 'saved' && !current.applied_at && row.applied_at === undefined) {
          row.applied_at = nowIso();
        }
      }

      const updated = applicationRepository.update(id, row);

      if (row.status && row.status !== current.status) {
        activityService.record({
          applicationId: id,
          type: 'status_change',
          message: `${STATUS_LABELS[current.status]} → ${STATUS_LABELS[row.status]}`,
          payload: { from: current.status, to: row.status },
        });
      }
      if (row.next_action_at !== undefined && row.next_action_at && row.next_action_at !== current.next_action_at) {
        activityService.record({
          applicationId: id,
          type: 'reminder_set',
          message: next.nextAction || 'Follow-up scheduled',
          payload: { dueAt: row.next_action_at },
        });
      }
      if (row.archived === 1 && current.archived === 0) {
        activityService.record({ applicationId: id, type: 'archived', message: 'Archived' });
      }

      return updated;
    });

    return serializeApplication(run());
  },

  reorder({ status, orderedIds }) {
    const run = db.transaction(() => {
      const moved = orderedIds
        .map((id) => applicationRepository.findById(id))
        .filter(Boolean)
        .filter((row) => row.status !== status);

      applicationRepository.reorder(status, orderedIds);

      for (const row of moved) {
        if (status !== 'saved' && !row.applied_at) {
          applicationRepository.update(row.id, { applied_at: nowIso() });
        }
        activityService.record({
          applicationId: row.id,
          type: 'status_change',
          message: `${STATUS_LABELS[row.status]} → ${STATUS_LABELS[status]}`,
          payload: { from: row.status, to: status },
        });
      }
    });
    run();
    return applicationService.board();
  },

  remove(id) {
    if (!applicationRepository.remove(id)) throw ApiError.notFound('Application');
  },

  timeline: (id) => {
    applicationService.get(id);
    return activityService.listForApplication(id);
  },

  addNote(id, { message, occurredAt }) {
    applicationService.get(id);
    return activityService.addNote(id, message, occurredAt);
  },

  statusLabels: STATUS_LABELS,
};
