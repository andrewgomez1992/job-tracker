import { db } from '../../db/index.js';
import { buildUpdate, withNulls } from '../../lib/sql.js';

const COLUMNS = ['title', 'situation', 'task', 'action', 'result', 'tags'];

export const storyRepository = {
  list: () => db.prepare('SELECT * FROM stories ORDER BY updated_at DESC').all(),
  findById: (id) => db.prepare('SELECT * FROM stories WHERE id = ?').get(id),
  create(row) {
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO stories (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map((c) => `@${c}`).join(', ')})`)
      .run(withNulls(row, COLUMNS));
    return storyRepository.findById(lastInsertRowid);
  },
  update(id, row) {
    const update = buildUpdate(row, COLUMNS);
    if (update) {
      db.prepare(`UPDATE stories SET ${update.clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = @id`)
        .run({ ...update.params, id });
    }
    return storyRepository.findById(id);
  },
  remove: (id) => db.prepare('DELETE FROM stories WHERE id = ?').run(id).changes > 0,
};
