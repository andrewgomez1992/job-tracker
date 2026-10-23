import { ApiError } from '../../lib/ApiError.js';
import { storyRepository } from './repository.js';

const serialize = (row) => ({
  id: row.id,
  title: row.title,
  situation: row.situation,
  task: row.task,
  action: row.action,
  result: row.result,
  tags: row.tags ? JSON.parse(row.tags) : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (body) => {
  const row = { ...body };
  if (body.tags !== undefined) row.tags = JSON.stringify(body.tags.map((t) => t.toLowerCase()));
  return row;
};

export const storyService = {
  list: () => storyRepository.list().map(serialize),
  get(id) {
    const row = storyRepository.findById(id);
    if (!row) throw ApiError.notFound('Story');
    return serialize(row);
  },
  create: (body) => serialize(storyRepository.create(toRow(body))),
  update(id, body) {
    storyService.get(id);
    return serialize(storyRepository.update(id, toRow(body)));
  },
  remove(id) {
    if (!storyRepository.remove(id)) throw ApiError.notFound('Story');
  },
};
