import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM')
  })
});

export const adminCreateTicketSchema = z.object({
  body: z.object({
    creatorId: z.string().uuid('Invalid user ID'),
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  }),
});

export const replyTicketSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty')
  })
});

export const processTicketSchema = z.object({
  body: z.object({
    status: z.enum(['IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    response: z.string().optional()
  })
});
