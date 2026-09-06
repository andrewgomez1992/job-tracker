import { ApiError } from '../../lib/ApiError.js';
import { activityRepository } from './repository.js';

const serialize = (row) =>
  row && {
    id: row.id,
    applicationId: row.application_id,
    type: row.type,
    message: row.message,
    payload: row.payload ? JSON.parse(row.payload) : null,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    ...(row.role ? { application: { role: row.role, companyName: row.company_name } } : {}),
  };

export const activityService = {
  /** Called by other services whenever something notable happens. */
  record: (input) => serialize(activityRepository.create(input)),

  listForApplication: (applicationId) =>
    activityRepository.listForApplication(applicationId).map(serialize),

  listRecent: (limit) => activityRepository.listRecent(limit).map(serialize),

  addNote(applicationId, message, occurredAt) {
    return activityService.record({ applicationId, type: 'note', message, occurredAt });
  },

  remove(id) {
    if (!activityRepository.remove(id)) throw ApiError.notFound('Activity');
  },

  serialize,
};
