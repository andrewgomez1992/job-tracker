import { asyncHandler } from '../../middleware/asyncHandler.js';
import { companyService } from './service.js';

export const companyController = {
  list: asyncHandler((req, res) => res.json({ data: companyService.list(req.query) })),
  get: asyncHandler((req, res) => res.json({ data: companyService.get(req.params.id) })),
  create: asyncHandler((req, res) => res.status(201).json({ data: companyService.create(req.body) })),
  update: asyncHandler((req, res) => res.json({ data: companyService.update(req.params.id, req.body) })),
  remove: asyncHandler((req, res) => {
    companyService.remove(req.params.id);
    res.status(204).end();
  }),
};
