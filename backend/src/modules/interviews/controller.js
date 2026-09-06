import { asyncHandler } from '../../middleware/asyncHandler.js';
import { interviewService } from './service.js';

export const interviewController = {
  list: asyncHandler((req, res) => res.json({ data: interviewService.list(req.query) })),
  get: asyncHandler((req, res) => res.json({ data: interviewService.get(req.params.id) })),
  create: asyncHandler((req, res) => res.status(201).json({ data: interviewService.create(req.body) })),
  update: asyncHandler((req, res) => res.json({ data: interviewService.update(req.params.id, req.body) })),
  remove: asyncHandler((req, res) => {
    interviewService.remove(req.params.id);
    res.status(204).end();
  }),
};
