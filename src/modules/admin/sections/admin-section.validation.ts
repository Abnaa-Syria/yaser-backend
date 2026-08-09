import { z } from 'zod';

export const createSectionSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    title: z.string().min(1),
    order: z.number().int().min(0),
  }),
});

export const listSectionsSchema = z.object({
  query: z.object({
    unitId: z.string().uuid().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().max(100).optional(),
  }),
});

export const updateSectionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const sectionIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
