import { z } from 'zod';
export const instructorIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid instructor ID format'),
    }),
});
export const createInstructorSchema = z.object({
    body: z.object({
        email: z.string().min(1, 'Email is required').email('Invalid email address'),
        password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
        fullName: z.string().min(1, 'Full name is required').min(3).max(100),
        phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format').optional(),
        bio: z.string().optional(),
        experience: z.number().int().min(0).optional(),
    }),
});
export const updateInstructorSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid instructor ID format'),
    }),
    body: z.object({
        fullName: z.string().min(3).max(100).optional(),
        email: z.string().email('Invalid email address').optional(),
        phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format').optional(),
        bio: z.string().optional(),
        experience: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    }),
});
export const listInstructorsSchema = z.object({
    query: z.object({
        isActive: z.enum(['true', 'false']).optional(),
        search: z.string().optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
//# sourceMappingURL=admin-instructor.validation.js.map