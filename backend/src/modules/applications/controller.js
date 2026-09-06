import { asyncHandler } from '../../middleware/asyncHandler.js';
import { applicationService } from './service.js';

export const applicationController = {
  list: asyncHandler((req, res) => res.json({ data: applicationService.list(req.query) })),
  board: asyncHandler((_req, res) => res.json({ data: applicationService.board() })),
  get: asyncHandler((req, res) => res.json({ data: applicationService.get(req.params.id) })),
  create: asyncHandler((req, res) => res.status(201).json({ data: applicationService.create(req.body) })),
  update: asyncHandler((req, res) => res.json({ data: applicationService.update(req.params.id, req.body) })),
  reorder: asyncHandler((req, res) => res.json({ data: applicationService.reorder(req.body) })),
  timeline: asyncHandler((req, res) => res.json({ data: applicationService.timeline(req.params.id) })),
  addNote: asyncHandler((req, res) =>
    res.status(201).json({ data: applicationService.addNote(req.params.id, req.body) })),
  remove: asyncHandler((req, res) => {
    applicationService.remove(req.params.id);
    res.status(204).end();
  }),
};
