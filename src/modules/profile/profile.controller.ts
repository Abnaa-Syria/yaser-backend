import { Request, Response } from 'express';
import * as profileService from './profile.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await profileService.getMyProfile(req.user.id);
  successResponse({ res, data: result, message: 'Profile retrieved successfully' });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const result = await profileService.updateMyProfile(req.user.id, req.body);
  successResponse({ res, data: result, message: 'Profile updated successfully' });
});

export const updateAvatar = catchAsync(async (req: Request, res: Response) => {
  const raw = req.body.avatar;
  const result = await profileService.updateMyAvatar(
    req.user.id,
    raw === '' || raw === null || raw === undefined ? null : String(raw)
  );
  successResponse({ res, data: result, message: 'Avatar updated successfully' });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const result = await profileService.changeMyPassword(req.user.id, currentPassword, newPassword);
  successResponse({ res, data: result, message: result.message });
});
