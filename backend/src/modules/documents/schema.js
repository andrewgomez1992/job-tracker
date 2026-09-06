import { z } from 'zod';
import { DOCUMENT_KINDS } from '../../lib/constants.js';

const text = (max = 500) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));

const optionalId = z
  .union([z.coerce.number().int().positive(), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v == null ? null : v));

export const documentCreateSchema = z.object({
  applicationId: optionalId,
  title: z.string().trim().min(1, 'Give it a title').max(200),
  kind: z.enum(DOCUMENT_KINDS).default('other'),
  versionLabel: text(120),
  url: text(2000),
  notes: text(5000),
});

export const documentUpdateSchema = documentCreateSchema.partial();
export const documentIdParams = z.object({ id: z.coerce.number().int().positive() });
export const documentListQuery = z.object({
  applicationId: z.coerce.number().int().positive().optional(),
  kind: z.enum(DOCUMENT_KINDS).optional(),
  search: z.string().trim().optional(),
});
