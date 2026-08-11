import { z } from 'zod';
import { requiredMediaUrl } from '../../../utils/mediaUrl.js';

export const courseCheckoutSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid course id'),
  }),
  body: z.object({
    paymentMethod: z.string().min(1, 'Payment method is required'),
    receiptUrl: z.string().optional(),
    couponCode: z.string().trim().min(1).optional(),
    pricingTierId: z.string().uuid().optional(),
    studentNote: z.string().max(1000).optional(),
  }),
});

export const packageCheckoutSchema = z.object({
  params: z.object({
    packageId: z.string().uuid('Invalid package id'),
  }),
  body: z.object({
    paymentMethod: z.string().min(1, 'Payment method is required'),
    receiptUrl: z.string().optional(),
    couponCode: z.string().trim().min(1).optional(),
    pricingTierId: z.string().uuid().optional(),
    studentNote: z.string().max(1000).optional(),
  }),
});

export const privateCheckoutSchema = z.object({
  params: z.object({
    availabilityId: z.string().uuid('Invalid availability id'),
  }),
  body: z.object({
    paymentMethod: z.string().min(1, 'Payment method is required'),
    receiptUrl: requiredMediaUrl,
  }),
});
