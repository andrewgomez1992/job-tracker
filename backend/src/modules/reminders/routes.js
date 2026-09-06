import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { reminderService } from './service.js';

export const reminderRoutes = Router();

reminderRoutes.get(
  '/',
  validate({
    query: z.object({
      horizonDays: z.coerce.number().int().min(1).max(60).default(7),
      staleDays: z.coerce.number().int().min(1).max(120).default(10),
    }),
  }),
  asyncHandler((req, res) => res.json({ data: reminderService.digest(req.query) })),
);
