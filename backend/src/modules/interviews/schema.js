import { z } from 'zod';
import { INTERVIEW_FORMATS, INTERVIEW_OUTCOMES } from '../../lib/constants.js';

const text = (max = 500) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));

const isoDate = z
  .string().trim().optional().nullable()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v == null || !Number.isNaN(Date.parse(v)), 'Not a valid date');

export const interviewCreateSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  stage: z.string().trim().min(1, 'Name this round').max(120),
  scheduledAt: isoDate,
  durationMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  format: z.enum(INTERVIEW_FORMATS).optional().nullable(),
  location: text(1000),
  interviewers: text(500),
  prepNotes: text(20000),
  notes: text(20000),
  outcome: z.enum(INTERVIEW_OUTCOMES).default('scheduled'),
});

export const interviewUpdateSchema = interviewCreateSchema.partial().omit({ applicationId: true });
export const interviewIdParams = z.object({ id: z.coerce.number().int().positive() });
export const interviewListQuery = z.object({
  applicationId: z.coerce.number().int().positive().optional(),
  outcome: z.enum(INTERVIEW_OUTCOMES).optional(),
  upcoming: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
