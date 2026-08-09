import { z } from 'zod';
import { OtpPurpose } from '@prisma/client';
// ============================================
// REGISTER
// ============================================
export const registerSchema = z.object({
    body: z.object({
        fullName: z
            .string({ message: 'Full name is required' })
            .min(3, 'Full name must be at least 3 characters')
            .max(100, 'Full name must be at most 100 characters'),
        email: z
            .string({ message: 'Email is required' })
            .email('Invalid email address'),
        password: z
            .string({ message: 'Password is required' })
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string({ message: 'Confirm password is required' }),
        phone: z
            .string()
            .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format')
            .optional(),
        deviceFingerprint: z.string().optional(),
        deviceName: z.string().optional(),
        os: z.string().optional(),
        academicLevel: z.string().optional().nullable(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});
// ============================================
// LOGIN
// ============================================
export const loginSchema = z.object({
    body: z.object({
        identifier: z
            .string({ message: 'Email is required' })
            .min(1, 'Email is required'),
        password: z
            .string({ message: 'Password is required' })
            .min(1, 'Password is required'),
        deviceFingerprint: z.string().optional(),
        deviceName: z.string().optional(),
        os: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
    }),
});
// ============================================
// REFRESH TOKEN
// ============================================
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string({ message: 'Refresh token is required' }),
    }),
});
// ============================================
// CHANGE PASSWORD
// ============================================
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(1, 'New password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmNewPassword: z.string().min(1, 'Confirm new password is required'),
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    }),
});
export const otpRequestSchema = z.object({
    body: z.object({
        purpose: z.nativeEnum(OtpPurpose),
    }),
});
export const otpVerifySchema = z.object({
    body: z.object({
        purpose: z.nativeEnum(OtpPurpose),
        code: z.string().length(6),
    }),
});
export const heartbeatSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1),
    }),
});
// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email address'),
    }),
});
// ============================================
// RESET PASSWORD
// ============================================
export const resetPasswordSchema = z.object({
    params: z.object({
        token: z.string().min(1, 'Reset token is required'),
    }),
    body: z.object({
        newPassword: z
            .string()
            .min(1, 'New password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmNewPassword: z.string().min(1, 'Confirm new password is required'),
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    }),
});
//# sourceMappingURL=auth.validation.js.map