import { db } from '../../db/index.js';
import { buildUpdate, withNulls } from '../../lib/sql.js';

const COLUMNS = [
  'application_id', 'stage', 'scheduled_at', 'duration_minutes', 'format',
  'location', 'interviewers', 'prep_notes', 'notes', 'outcome',
];

const SELECT = `
  SELECT i.*, a.role AS application_role, a.status AS application_status, c.name AS company_name
  FROM interviews i
  JOIN applications a ON a.id = i.application_id
  JOIN companies c ON c.id = a.company_id
`;

export const interviewRepository = {
  list(filters = {}) {
    const where = [];
    const params = { limit: filters.limit ?? 100 };
    if (filters.applicationId) { where.push('i.application_id = @applicationId'); params.applicationId = filters.applicationId; }
    if (filters.outcome) { where.push('i.outcome = @outcome'); params.outcome = filters.outcome; }
    if (filters.upcoming) {
      where.push("i.scheduled_at IS NOT NULL AND i.scheduled_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now') AND i.outcome = 'scheduled'");
    }
    const order = filters.upcoming ? 'i.scheduled_at ASC' : 'i.scheduled_at IS NULL, i.scheduled_at DESC';
    return db
      .prepare(`${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT @limit`)
      .all(params);
  },

  findById(id) {
    return db.prepare(`${SELECT} WHERE i.id = ?`).get(id);
  },

  create(row) {
    const data = withNulls(row, COLUMNS);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO interviews (application_id, stage, scheduled_at, duration_minutes, format,
                                 location, interviewers, prep_notes, notes, outcome)
         VALUES (@application_id, @stage, @scheduled_at, @duration_minutes, @format,
                 @location, @interviewers, @prep_notes, @notes, @outcome)`,
      )
      .run({ ...data, outcome: data.outcome || 'scheduled' });
    return this.findById(Number(lastInsertRowid));
  },

  update(id, patch) {
    const update = buildUpdate(patch, COLUMNS);
    if (update) {
      db.prepare(`UPDATE interviews SET ${update.clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = @id`)
        .run({ ...update.params, id });
    }
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM interviews WHERE id = ?').run(id).changes > 0;
  },
};
