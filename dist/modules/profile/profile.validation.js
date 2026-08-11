import { z } from 'zod';
export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(3).max(100).optional(),
        phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format').optional(),
        bio: z.string().max(500).optional(),
        experience: z.number().int().min(0).optional(),
    }),
});
const avatarValueSchema = z.union([
    z.literal(''),
    z.null(),
    z
        .string()
        .min(1)
        .max(600000)
        .refine((s) => {
        if (s.startsWith('/uploads/'))
            return true;
        try {
            const u = new URL(s);
            return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:';
        }
        catch {
            return false;
        }
    }, 'Invalid avatar URL'),
]);
export const updateAvatarSchema = z.object({
    body: z.object({
        avatar: avatarValueSchema,
    }),
});
//# sourceMappingURL=profile.validation.js.map