import { ApiError } from '../../lib/ApiError.js';
import { db } from '../../db/index.js';
import { activityService } from '../activities/service.js';
import { interviewRepository } from './repository.js';

const serialize = (row) =>
  row && {
    id: row.id,
    applicationId: row.application_id,
    applicationRole: row.application_role,
    applicationStatus: row.application_status,
    companyName: row.company_name,
    stage: row.stage,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    format: row.format,
    location: row.location,
    interviewers: row.interviewers,
    prepNotes: row.prep_notes,
    notes: row.notes,
    outcome: row.outcome,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const toRow = (input) => {
  const map = {
    applicationId: 'application_id', stage: 'stage', scheduledAt: 'scheduled_at',
    durationMinutes: 'duration_minutes', format: 'format', location: 'location',
    interviewers: 'interviewers', prepNotes: 'prep_notes', notes: 'notes', outcome: 'outcome',
  };
  const row = {};
  for (const [from, to] of Object.entries(map)) if (input[from] !== undefined) row[to] = input[from];
  return row;
};

export const interviewService = {
  list: (filters) => interviewRepository.list(filters).map(serialize),

  get(id) {
    const row = interviewRepository.findById(id);
    if (!row) throw ApiError.notFound('Interview');
    return serialize(row);
  },

  create(payload) {
    const run = db.transaction(() => {
      const created = interviewRepository.create(toRow(payload));
      activityService.record({
        applicationId: created.application_id,
        type: 'interview_scheduled',
        message: `${created.stage}${created.scheduled_at ? '' : ' (no date yet)'}`,
        payload: { interviewId: created.id, scheduledAt: created.scheduled_at },
        occurredAt: created.scheduled_at || null,
      });
      return created;
    });
    return serialize(run());
  },

  update(id, patch) {
    const current = interviewRepository.findById(id);
    if (!current) throw ApiError.notFound('Interview');

    const run = db.transaction(() => {
      const row = toRow(patch);
      const updated = interviewRepository.update(id, row);
      if (row.outcome && row.outcome !== current.outcome) {
        activityService.record({
          applicationId: current.application_id,
          type: 'interview_outcome',
          message: `${current.stage}: ${row.outcome.replace('_', ' ')}`,
          payload: { interviewId: id, from: current.outcome, to: row.outcome },
        });
      }
      return updated;
    });
    return serialize(run());
  },

  remove(id) {
    interviewService.get(id);
    interviewRepository.remove(id);
  },
};
