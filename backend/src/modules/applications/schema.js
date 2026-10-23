import { z } from 'zod';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
} from '../../lib/constants.js';

const text = (max = 500) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));

const isoDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v == null || !Number.isNaN(Date.parse(v)), 'Not a valid date');

const money = z.coerce.number().int().min(0).max(100_000_000).optional().nullable();

export const applicationCreateSchema = z
  .object({
    companyId: z.coerce.number().int().positive().optional().nullable(),
    companyName: z.string().trim().min(1).max(200).optional().nullable(),
    role: z.string().trim().min(1, 'Role title is required').max(200),
    status: z.enum(APPLICATION_STATUSES).default('saved'),
    priority: z.coerce.number().int().min(1).max(3).default(2),
    source: text(120),
    jobUrl: text(2000),
    location: text(200),
    workMode: z.enum(WORK_MODES).optional().nullable(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional().nullable(),
    salaryMin: money,
    salaryMax: money,
    salaryCurrency: z.string().trim().length(3).default('USD'),
    jobDescription: text(50_000),
    summary: text(20_000),
    notes: text(20_000),
    appliedAt: isoDate,
    nextAction: text(300),
    nextActionAt: isoDate,
  })
  .refine((data) => data.companyId != null || data.companyName, {
    message: 'Pick an existing company or type a new one',
    path: ['companyName'],
  })
  .refine((data) => data.salaryMin == null || data.salaryMax == null || data.salaryMin <= data.salaryMax, {
    message: 'Minimum salary cannot be above the maximum',
    path: ['salaryMin'],
  });

export const applicationUpdateSchema = z
  .object({
    companyId: z.coerce.number().int().positive().optional(),
    companyName: z.string().trim().min(1).max(200).optional(),
    role: z.string().trim().min(1).max(200).optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    priority: z.coerce.number().int().min(1).max(3).optional(),
    source: text(120),
    jobUrl: text(2000),
    location: text(200),
    workMode: z.enum(WORK_MODES).optional().nullable(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional().nullable(),
    salaryMin: money,
    salaryMax: money,
    salaryCurrency: z.string().trim().length(3).optional(),
    jobDescription: text(50_000),
    summary: text(20_000),
    notes: text(20_000),
    appliedAt: isoDate,
    nextAction: text(300),
    nextActionAt: isoDate,
    archived: z.coerce.boolean().optional(),
  })
  .refine((data) => data.salaryMin == null || data.salaryMax == null || data.salaryMin <= data.salaryMax, {
    message: 'Minimum salary cannot be above the maximum',
    path: ['salaryMin'],
  });

export const applicationIdParams = z.object({ id: z.coerce.number().int().positive() });

const csvEnum = (values) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined))
    .refine((list) => !list || list.every((s) => values.includes(s)), 'Unknown value');

export const applicationListQuery = z.object({
  search: z.string().trim().optional(),
  status: csvEnum(APPLICATION_STATUSES),
  companyId: z.coerce.number().int().positive().optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
  archived: z
    .enum(['true', 'false', 'all'])
    .default('false')
    .transform((v) => (v === 'all' ? null : v === 'true')),
  sort: z.enum(['updated', 'created', 'applied', 'company', 'role', 'priority', 'next_action']).default('updated'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(5000).default(200),
});

export const reorderSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  orderedIds: z.array(z.coerce.number().int().positive()).max(500),
});
