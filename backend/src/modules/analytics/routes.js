import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { analyticsService } from './service.js';

export const analyticsRoutes = Router();

analyticsRoutes.get(
  '/overview',
  validate({ query: z.object({ weeks: z.coerce.number().int().min(4).max(52).default(12) }) }),
  asyncHandler((req, res) => res.json({ data: analyticsService.overview(req.query) })),
);
