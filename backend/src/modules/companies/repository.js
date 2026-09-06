import { db } from '../../db/index.js';
import { buildUpdate, likeTerm, withNulls } from '../../lib/sql.js';

const COLUMNS = ['name', 'website', 'industry', 'location', 'notes'];

const SELECT_WITH_COUNTS = `
  SELECT c.*,
         (SELECT COUNT(*) FROM applications a WHERE a.company_id = c.id AND a.archived = 0) AS application_count,
         (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count
  FROM companies c
`;

export const companyRepository = {
  list({ search } = {}) {
    if (search) {
      return db
        .prepare(`${SELECT_WITH_COUNTS} WHERE c.name LIKE ? ESCAPE '\\' ORDER BY c.name COLLATE NOCASE`)
        .all(likeTerm(search));
    }
    return db.prepare(`${SELECT_WITH_COUNTS} ORDER BY c.name COLLATE NOCASE`).all();
  },

  findById(id) {
    return db.prepare(`${SELECT_WITH_COUNTS} WHERE c.id = ?`).get(id);
  },

  findByName(name) {
    return db.prepare('SELECT * FROM companies WHERE name = ? COLLATE NOCASE').get(name);
  },

  create(payload) {
    const data = withNulls(payload, COLUMNS);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO companies (name, website, industry, location, notes)
         VALUES (@name, @website, @industry, @location, @notes)`,
      )
      .run(data);
    return this.findById(Number(lastInsertRowid));
  },

  update(id, patch) {
    const update = buildUpdate(patch, COLUMNS);
    if (update) {
      db.prepare(
        `UPDATE companies SET ${update.clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = @id`,
      ).run({ ...update.params, id });
    }
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM companies WHERE id = ?').run(id).changes > 0;
  },
};
