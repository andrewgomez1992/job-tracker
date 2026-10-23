import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { storyCreateSchema, storyIdParams, storyUpdateSchema } from './schema.js';
import { storyService } from './service.js';

export const storyRoutes = Router();

storyRoutes.get('/', asyncHandler((_req, res) => res.json({ data: storyService.list() })));
storyRoutes.post('/', validate({ body: storyCreateSchema }),
  asyncHandler((req, res) => res.status(201).json({ data: storyService.create(req.body) })));
storyRoutes.patch('/:id', validate({ params: storyIdParams, body: storyUpdateSchema }),
  asyncHandler((req, res) => res.json({ data: storyService.update(req.params.id, req.body) })));
storyRoutes.delete('/:id', validate({ params: storyIdParams }),
  asyncHandler((req, res) => { storyService.remove(req.params.id); res.status(204).end(); }));
