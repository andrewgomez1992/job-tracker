import { z } from 'zod';
import { CONTACT_RELATIONSHIPS } from '../../lib/constants.js';

const text = (max = 300) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));

const email = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v == null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'That does not look like an email');

export const contactCreateSchema = z.object({
  companyId: z.coerce.number().int().positive().optional().nullable(),
  applicationId: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().trim().min(1, 'Name is required').max(200),
  title: text(200),
  email,
  phone: text(60),
  linkedinUrl: text(500),
  relationship: z.enum(CONTACT_RELATIONSHIPS).default('other'),
  lastContactedAt: text(60),
  notes: text(5000),
});

export const contactUpdateSchema = contactCreateSchema.partial();
export const contactIdParams = z.object({ id: z.coerce.number().int().positive() });
export const contactListQuery = z.object({
  search: z.string().trim().optional(),
  companyId: z.coerce.number().int().positive().optional(),
  applicationId: z.coerce.number().int().positive().optional(),
  relationship: z.enum(CONTACT_RELATIONSHIPS).optional(),
});
