import { z } from 'zod';
import { requiredMediaUrl } from '../../../utils/mediaUrl.js';

export const createResourceSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(255),
    fileUrl: requiredMediaUrl,
    fileType: z.string().optional(),
    mimeType: z.string().optional(),
    fileSizeBytes: z.coerce.number().int().nonnegative().optional(),
    resourceType: z.enum(['VIDEO_HLS', 'PDF', 'PPT', 'IMAGE', 'LINK', 'DOCUMENT']).optional(),
  }),
});

export const lessonIdParamSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
});

export const uploadResourceSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
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

