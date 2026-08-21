import * as authService from './auth.service.js';
import * as deviceReplacementService from './device-replacement.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AppError } from '../../utils/AppError.js';
export const register = catchAsync(async (req, res) => {
    const result = await authService.registerUser(req.body);
    successResponse({ res, data: result, message: 'User registered successfully', statusCode: 201 });
});
export const login = catchAsync(async (req, res) => {
    const result = await authService.loginUser(req.body);
    successResponse({ res, data: result, message: 'Login successful' });
});
export const requestDeviceReplacement = catchAsync(async (req, res) => {
    const result = await deviceReplacementService.requestDeviceReplacement(req.body);
    successResponse({ res, data: result, message: result.message, statusCode: 201 });
});
export const logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        // مش error — الـ logout المفروض يبقى دايماً ناجح
        return successResponse({ res, message: 'Logged out successfully' });
    }
    const result = await authService.logoutUser(refreshToken);
    successResponse({ res, data: result, message: 'Logged out successfully' });
});
export const refreshTokens = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new AppError('Refresh token is required.', 400);
    }
    const result = await authService.refreshAuthTokens(refreshToken);
    successResponse({ res, data: result, message: 'Tokens refreshed successfully' });
});
export const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    successResponse({ res, data: result, message: result.message });
});
export const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    successResponse({ res, data: result, message: result.message });
});
export const resetPassword = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    successResponse({ res, data: result, message: result.message });
});
export const verifyEmail = catchAsync(async (req, res) => {
    const token = (req.body?.token || req.params.token);
    if (!token)
        throw new AppError('Verification token is required.', 400);
    const result = await authService.verifyEmail(token);
    successResponse({ res, data: result, message: result.message });
});
export const resendVerification = catchAsync(async (req, res) => {
    const result = await authService.resendEmailVerification(req.body.email);
    successResponse({ res, data: result, message: result.message });
});
//# sourceMappingURL=auth.controller.js.map