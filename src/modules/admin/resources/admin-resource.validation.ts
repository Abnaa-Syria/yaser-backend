import { z } from 'zod';

export const createResourceSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255),
    fileUrl: z.string().url(),
    fileType: z.string().optional(),
  }),
});

export const resourceIdParamSchema = z.object({
  params: z.object({
    resourceId: z.string().uuid(),
  }),
});

export const listResourcesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    lessonId: z.string().uuid().optional(),
  }),
});

