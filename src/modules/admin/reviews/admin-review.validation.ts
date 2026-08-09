import { z } from 'zod';

export const toggleVisibilitySchema = z.object({
  params: z.object({
    reviewId: z.string().uuid(),
  }),
  body: z.object({
    isVisible: z.boolean(),
  }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    reviewId: z.string().uuid(),
  }),
});

export const listReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    courseId: z.string().uuid().optional(),
    rating: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const exportReviewsPdfSchema = z.object({
  query: z.object({
    courseId: z.string().uuid(),
  }),
});

