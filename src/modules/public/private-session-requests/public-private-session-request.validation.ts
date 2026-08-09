import { z } from 'zod';

export const createPrivateSessionRequestSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(254),
    phone: z.string().max(40).optional(),
    message: z.string().min(10).max(5000),
    preferredTime: z.string().max(300).optional(),
    instructorId: z.string().uuid().optional(),
  }),
});
