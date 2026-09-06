import { asyncHandler } from '../../middleware/asyncHandler.js';
import { contactService } from './service.js';

export const contactController = {
  list: asyncHandler((req, res) => res.json({ data: contactService.list(req.query) })),
  get: asyncHandler((req, res) => res.json({ data: contactService.get(req.params.id) })),
  create: asyncHandler((req, res) => res.status(201).json({ data: contactService.create(req.body) })),
  update: asyncHandler((req, res) => res.json({ data: contactService.update(req.params.id, req.body) })),
  remove: asyncHandler((req, res) => {
    contactService.remove(req.params.id);
    res.status(204).end();
  }),
};
