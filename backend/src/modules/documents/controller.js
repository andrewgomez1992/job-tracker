import path from 'node:path';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { documentService } from './service.js';

export const documentController = {
  list: asyncHandler((req, res) => res.json({ data: documentService.list(req.query) })),
  get: asyncHandler((req, res) => res.json({ data: documentService.get(req.params.id) })),
  create: asyncHandler((req, res) =>
    res.status(201).json({ data: documentService.create(req.body, req.file) })),
  update: asyncHandler((req, res) => res.json({ data: documentService.update(req.params.id, req.body) })),
  remove: asyncHandler((req, res) => {
    documentService.remove(req.params.id);
    res.status(204).end();
  }),
  download: asyncHandler((req, res) => {
    const row = documentService.getRaw(req.params.id);
    if (!row.file_path) throw ApiError.notFound('File');
    // basename() keeps a crafted path from escaping the uploads directory.
    res.download(path.join(env.uploadsDir, path.basename(row.file_path)), row.file_name || 'document');
  }),
};
