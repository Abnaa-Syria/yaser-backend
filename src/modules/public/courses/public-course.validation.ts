import { z } from 'zod';

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
  }),
});

export const recommendedCoursesQuerySchema = z.object({
  query: z.object({
    filter: z.string().optional().default('bestseller'),
    limit: z.string().regex(/^\d+$/).optional().default('8'),
  }),
});

export const listCoursesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    search: z.string().optional(),
    category: z.string().optional(), // category slug
  }),
});
