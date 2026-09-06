import { db } from '../../db/index.js';

export const activityRepository = {
  create({ applicationId, type, message = null, payload = null, occurredAt = null }) {
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO activities (application_id, type, message, payload, occurred_at)
         VALUES (?, ?, ?, ?, COALESCE(?, strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
      )
      .run(applicationId, type, message, payload ? JSON.stringify(payload) : null, occurredAt);
    return this.findById(Number(lastInsertRowid));
  },

  findById(id) {
    return db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  },

  listForApplication(applicationId) {
    return db
      .prepare('SELECT * FROM activities WHERE application_id = ? ORDER BY occurred_at DESC, id DESC')
      .all(applicationId);
  },

  listRecent(limit = 30) {
    return db
      .prepare(
        `SELECT ac.*, a.role, c.name AS company_name
         FROM activities ac
         JOIN applications a ON a.id = ac.application_id
         JOIN companies c ON c.id = a.company_id
         ORDER BY ac.occurred_at DESC, ac.id DESC
         LIMIT ?`,
      )
      .all(limit);
  },

  remove(id) {
    return db.prepare('DELETE FROM activities WHERE id = ?').run(id).changes > 0;
  },
};
