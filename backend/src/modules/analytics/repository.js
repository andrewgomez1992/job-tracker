import { db } from '../../db/index.js';

export const analyticsRepository = {
  /** Everything the analytics service needs, in three cheap reads. */
  applications() {
    return db
      .prepare(
        `SELECT a.id, a.status, a.source, a.applied_at, a.created_at, a.archived,
                a.salary_min, a.salary_max, c.name AS company_name
         FROM applications a JOIN companies c ON c.id = a.company_id`,
      )
      .all();
  },

  statusChanges() {
    return db
      .prepare(
        `SELECT application_id,
                json_extract(payload, '$.from') AS from_status,
                json_extract(payload, '$.to')   AS to_status,
                occurred_at
         FROM activities
         WHERE type = 'status_change'
         ORDER BY occurred_at ASC, id ASC`,
      )
      .all();
  },

  interviewCounts() {
    return db
      .prepare(
        `SELECT outcome, COUNT(*) AS count FROM interviews GROUP BY outcome`,
      )
      .all();
  },
};
