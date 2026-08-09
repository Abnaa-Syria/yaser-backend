import { Request, Response } from 'express';
import * as notificationService from './notification.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';

export const getNotificationsHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.getUserNotifications(req.user.id);
  successResponse({ res, data: result, message: 'Notifications retrieved successfully' });
});

export const markAsReadHandler = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.user.id, String(req.params.id));
  successResponse({ res, data: null, message: 'Notification marked as read' });
});

export const markAllAsReadHandler = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user.id);
  successResponse({ res, data: null, message: 'All notifications marked as read' });
});
