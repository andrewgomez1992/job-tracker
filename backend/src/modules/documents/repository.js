import { db } from '../../db/index.js';
import { buildUpdate, likeTerm, withNulls } from '../../lib/sql.js';

const COLUMNS = [
  'application_id', 'title', 'kind', 'version_label', 'url',
  'file_name', 'file_path', 'file_size', 'mime_type', 'notes',
];

const SELECT = `
  SELECT d.*, a.role AS application_role, c.name AS company_name
  FROM documents d
  LEFT JOIN applications a ON a.id = d.application_id
  LEFT JOIN companies c ON c.id = a.company_id
`;

export const documentRepository = {
  list(filters = {}) {
    const where = [];
    const params = {};
    if (filters.applicationId) { where.push('d.application_id = @applicationId'); params.applicationId = filters.applicationId; }
    if (filters.kind) { where.push('d.kind = @kind'); params.kind = filters.kind; }
    if (filters.search) {
      where.push(`(d.title LIKE @search ESCAPE '\\' OR d.version_label LIKE @search ESCAPE '\\')`);
      params.search = likeTerm(filters.search);
    }
    return db
      .prepare(`${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY d.created_at DESC`)
      .all(params);
  },

  findById(id) {
    return db.prepare(`${SELECT} WHERE d.id = ?`).get(id);
  },

  create(row) {
    const data = withNulls(row, COLUMNS);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO documents (application_id, title, kind, version_label, url,
                                file_name, file_path, file_size, mime_type, notes)
         VALUES (@application_id, @title, @kind, @version_label, @url,
                 @file_name, @file_path, @file_size, @mime_type, @notes)`,
      )
      .run({ ...data, kind: data.kind || 'other' });
    return this.findById(Number(lastInsertRowid));
  },

  update(id, patch) {
    const update = buildUpdate(patch, COLUMNS);
    if (update) {
      db.prepare(`UPDATE documents SET ${update.clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = @id`)
        .run({ ...update.params, id });
    }
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM documents WHERE id = ?').run(id).changes > 0;
  },
};
