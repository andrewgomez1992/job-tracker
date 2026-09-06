import { z } from 'zod';

export const activityIdParams = z.object({ id: z.coerce.number().int().positive() });

export const activityListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(30),
});

export const noteCreateSchema = z.object({
  message: z.string().trim().min(1, 'Write something first').max(5000),
  occurredAt: z.string().trim().optional().nullable(),
});
