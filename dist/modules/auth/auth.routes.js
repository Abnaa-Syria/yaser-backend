import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';
import * as authController from './auth.controller.js';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, otpRequestSchema, otpVerifySchema, heartbeatSchema, } from './auth.validation.js';
import * as authSessionController from './auth-session.controller.js';
const router = Router();
// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout); // مش protected عشان الـ token ممكن يكون expired
router.post('/refresh', validate(refreshTokenSchema), authController.refreshTokens);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);
router.post('/otp/request', protect, validate(otpRequestSchema), authSessionController.requestOtpCode);
router.post('/otp/verify', protect, validate(otpVerifySchema), authSessionController.verifyOtpCode);
router.post('/heartbeat', protect, validate(heartbeatSchema), authSessionController.heartbeat);
// ============================================
// PROTECTED ROUTES
// ============================================
// All protected account management moved to Profile module
export default router;
//# sourceMappingURL=auth.routes.js.map