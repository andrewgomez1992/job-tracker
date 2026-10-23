import { z } from 'zod';

const text = (max = 5000) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));

export const storyCreateSchema = z.object({
  title: z.string().trim().min(1, 'Give the story a title').max(200),
  situation: text(),
  task: text(),
  action: text(),
  result: text(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
});
export const storyUpdateSchema = storyCreateSchema.partial();
export const storyIdParams = z.object({ id: z.coerce.number().int().positive() });
