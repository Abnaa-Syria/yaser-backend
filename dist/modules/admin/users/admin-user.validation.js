import { z } from 'zod';
export const userIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
});
export const updateAdminUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
    body: z.object({
        fullName: z.string().min(3).max(100).optional(),
        email: z.string().email('Invalid email address').optional(),
        roleId: z.string().uuid('Invalid role ID format').optional(),
        isActive: z.boolean().optional(),
        phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format').optional(),
        academicLevel: z.string().optional().nullable(),
    }),
});
export const listUsersSchema = z.object({
    query: z.object({
        role: z
            .enum([
            'SUPER_ADMIN',
            'ADMIN',
            'INSTRUCTOR',
            'TEACHING_ASSISTANT',
            'CONTENT_REVIEWER',
            'FINANCIAL_MANAGER',
            'TECHNICAL_SUPPORT',
            'STUDENT',
        ])
            .optional(),
        isActive: z.enum(['true', 'false']).optional(),
        search: z.string().optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
export const grantPermissionSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        permissionId: z.string().uuid(),
        expiresAt: z.string().datetime().optional(),
    }),
});
export const setAdminUserPasswordSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
    body: z.object({
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }),
});
export const revokePermissionSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        permissionId: z.string().uuid(),
    }),
});
//# sourceMappingURL=admin-user.validation.js.map