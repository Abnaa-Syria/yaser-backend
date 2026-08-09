import { z } from 'zod';

export const payoutRequestSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    payoutMethod: z.string().min(2),
    payoutDetails: z.string().min(3),
  }),
});

export const querySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  }),
});
