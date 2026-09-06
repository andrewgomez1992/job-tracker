import { db } from '../../db/index.js';
import { buildUpdate, likeTerm, withNulls } from '../../lib/sql.js';

const COLUMNS = [
  'company_id', 'role', 'status', 'priority', 'source', 'job_url', 'location',
  'work_mode', 'employment_type', 'salary_min', 'salary_max', 'salary_currency',
  'job_description', 'notes', 'applied_at', 'next_action', 'next_action_at',
  'board_order', 'archived',
];

// board_order and archived are set by the repository, not the caller.
const INSERT_COLUMNS = COLUMNS.filter((c) => c !== 'board_order' && c !== 'archived');

const SELECT = `
  SELECT a.*,
         c.name AS company_name,
         c.website AS company_website,
         (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id) AS interview_count,
         (SELECT COUNT(*) FROM contacts ct WHERE ct.application_id = a.id) AS contact_count,
         (SELECT COUNT(*) FROM documents d WHERE d.application_id = a.id) AS document_count,
         (SELECT MIN(i.scheduled_at) FROM interviews i
           WHERE i.application_id = a.id AND i.outcome = 'scheduled'
             AND i.scheduled_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now')) AS next_interview_at
  FROM applications a
  JOIN companies c ON c.id = a.company_id
`;

const SORTS = {
  updated: 'a.updated_at',
  created: 'a.created_at',
  applied: 'a.applied_at',
  company: 'c.name COLLATE NOCASE',
  role: 'a.role COLLATE NOCASE',
  priority: 'a.priority',
  next_action: 'a.next_action_at',
};

export const applicationRepository = {
  list(filters = {}) {
    const where = [];
    const params = {};

    if (filters.archived !== null && filters.archived !== undefined) {
      where.push('a.archived = @archived');
      params.archived = filters.archived ? 1 : 0;
    }
    if (filters.status?.length) {
      where.push(`a.status IN (${filters.status.map((_, i) => `@status${i}`).join(', ')})`);
      filters.status.forEach((s, i) => { params[`status${i}`] = s; });
    }
    if (filters.companyId) {
      where.push('a.company_id = @companyId');
      params.companyId = filters.companyId;
    }
    if (filters.priority) {
      where.push('a.priority = @priority');
      params.priority = filters.priority;
    }
    if (filters.search) {
      where.push(`(a.role LIKE @search ESCAPE '\\' OR c.name LIKE @search ESCAPE '\\'
                   OR a.location LIKE @search ESCAPE '\\' OR a.notes LIKE @search ESCAPE '\\')`);
      params.search = likeTerm(filters.search);
    }

    const order = SORTS[filters.sort || 'updated'];
    const direction = (filters.direction || 'desc').toUpperCase();
    const sql = `${SELECT}
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${order} IS NULL, ${order} ${direction}, a.id DESC
      LIMIT @limit`;

    return db.prepare(sql).all({ ...params, limit: filters.limit ?? 200 });
  },

  board() {
    return db
      .prepare(`${SELECT} WHERE a.archived = 0 ORDER BY a.board_order ASC, a.updated_at DESC`)
      .all();
  },

  findById(id) {
    return db.prepare(`${SELECT} WHERE a.id = ?`).get(id);
  },

  create(input) {
    // INSERT uses named parameters, so every column must be present.
    const row = withNulls(input, INSERT_COLUMNS);
    const nextOrder =
      db.prepare('SELECT COALESCE(MIN(board_order), 0) - 1 AS n FROM applications WHERE status = ?')
        .get(row.status).n;

    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO applications
           (company_id, role, status, priority, source, job_url, location, work_mode,
            employment_type, salary_min, salary_max, salary_currency, job_description,
            notes, applied_at, next_action, next_action_at, board_order)
         VALUES
           (@company_id, @role, @status, @priority, @source, @job_url, @location, @work_mode,
            @employment_type, @salary_min, @salary_max, @salary_currency, @job_description,
            @notes, @applied_at, @next_action, @next_action_at, @board_order)`,
      )
      .run({
        ...row,
        status: row.status || 'saved',
        priority: row.priority ?? 2,
        salary_currency: row.salary_currency || 'USD',
        board_order: nextOrder,
      });

    return this.findById(Number(lastInsertRowid));
  },

  update(id, patch) {
    const update = buildUpdate(patch, COLUMNS);
    if (update) {
      db.prepare(
        `UPDATE applications SET ${update.clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = @id`,
      ).run({ ...update.params, id });
    }
    return this.findById(id);
  },

  reorder(status, orderedIds) {
    const stmt = db.prepare(
      `UPDATE applications SET status = ?, board_order = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    );
    const run = db.transaction((ids) => {
      ids.forEach((id, index) => stmt.run(status, index, id));
    });
    run(orderedIds);
  },

  remove(id) {
    return db.prepare('DELETE FROM applications WHERE id = ?').run(id).changes > 0;
  },

  /** Applications with a follow-up date, for the reminders view. */
  dueReminders(untilIso) {
    return db
      .prepare(
        `${SELECT} WHERE a.archived = 0 AND a.next_action_at IS NOT NULL
           AND a.next_action_at <= @until
         ORDER BY a.next_action_at ASC`,
      )
      .all({ until: untilIso });
  },

  /** Applied a while ago and still no response - candidates for a nudge. */
  stale(days) {
    return db
      .prepare(
        `${SELECT} WHERE a.archived = 0 AND a.status = 'applied' AND a.applied_at IS NOT NULL
           AND julianday('now') - julianday(a.applied_at) >= @days
         ORDER BY a.applied_at ASC`,
      )
      .all({ days });
  },
};
