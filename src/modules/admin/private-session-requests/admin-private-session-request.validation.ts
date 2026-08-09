import { z } from 'zod';

export const listPrivateSessionRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'CLOSED', 'ARCHIVED']).optional(),
  }),
});

export const updatePrivateSessionRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['NEW', 'CONTACTED', 'CLOSED', 'ARCHIVED']).optional(),
    adminNotes: z.string().max(5000).optional().nullable(),
  }),
});
