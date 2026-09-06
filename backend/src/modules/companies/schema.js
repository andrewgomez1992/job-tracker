import { z } from 'zod';

const trimmed = z.string().trim();
const optionalText = trimmed.max(2000).optional().nullable();

export const companyCreateSchema = z.object({
  name: trimmed.min(1, 'Company name is required').max(200),
  website: optionalText,
  industry: optionalText,
  location: optionalText,
  notes: optionalText,
});

export const companyUpdateSchema = companyCreateSchema.partial();

export const companyIdParams = z.object({ id: z.coerce.number().int().positive() });

export const companyListQuery = z.object({
  search: trimmed.optional(),
});
