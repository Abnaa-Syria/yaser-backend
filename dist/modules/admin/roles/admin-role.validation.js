import { z } from 'zod';
const permissionKey = z.string().min(3).max(80);
export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(80),
        description: z.string().max(255).optional(),
        permissions: z.array(permissionKey).min(1),
    }),
});
export const updateRoleSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z
        .object({
        name: z.string().min(2).max(80).optional(),
        description: z.string().max(255).optional(),
        permissions: z.array(permissionKey).min(1).optional(),
    })
        .refine((val) => Object.keys(val).length > 0, {
        message: 'At least one field is required',
    }),
});
export const setPermissionsSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        permissions: z.array(permissionKey).min(1),
    }),
});
//# sourceMappingURL=admin-role.validation.js.map