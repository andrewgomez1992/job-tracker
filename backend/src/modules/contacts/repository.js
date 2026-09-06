import { db } from '../../db/index.js';
import { buildUpdate, likeTerm, withNulls } from '../../lib/sql.js';

const COLUMNS = [
  'company_id', 'application_id', 'name', 'title', 'email', 'phone',
  'linkedin_url', 'relationship', 'last_contacted_at', 'notes',
];

const SELECT = `
  SELECT ct.*, c.name AS company_name, a.role AS application_role
  FROM contacts ct
  LEFT JOIN companies c ON c.id = ct.company_id
  LEFT JOIN applications a ON a.id = ct.application_id
`;

export const contactRepository = {
  list(filters = {}) {
    const where = [];
    const params = {};
    if (filters.companyId) { where.push('ct.company_id = @companyId'); params.companyId = filters.companyId; }
    if (filters.applicationId) { where.push('ct.application_id = @applicationId'); params.applicationId = filters.applicationId; }
    if (filters.relationship) { where.push('ct.relationship = @relationship'); params.relationship = filters.relationship; }
    if (filters.search) {
      where.push(`(ct.name LIKE @search ESCAPE '\\' OR ct.email LIKE @search ESCAPE '\\' OR c.name LIKE @search ESCAPE '\\')`);
      params.search = likeTerm(filters.search);
    }
    return db
      .prepare(`${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ct.name COLLATE NOCASE`)
      .all(params);
  },

  findById(id) {
    return db.prepare(`${SELECT} WHERE ct.id = ?`).get(id);
  },

  create(row) {
    const data = withNulls(row, COLUMNS);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO contacts (company_id, application_id, name, title, email, phone,
                               linkedin_url, relationship, last_contacted_at, notes)
         VALUES (@company_id, @application_id, @name, @title, @email, @phone,
                 @linkedin_url, @relationship, @last_contacted_at, @notes)`,
      )
      .run({ ...data, relationship: data.relationship || 'other' });
    return this.findById(Number(lastInsertRowid));
  },

  update(id, patch) {
    const update = buildUpdate(patch, COLUMNS);
    if (update) {
      db.prepare(`UPDATE contacts SET ${update.clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = @id`)
        .run({ ...update.params, id });
    }
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM contacts WHERE id = ?').run(id).changes > 0;
  },
};
