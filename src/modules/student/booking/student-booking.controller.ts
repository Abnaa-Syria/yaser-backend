import { Request, Response } from 'express';
import * as bookingService from './student-booking.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const listAvailableSlotsHandler = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
  const result = await bookingService.listAvailableSlots(limit);
  successResponse({ res, data: result, message: 'Available slots retrieved' });
});

export const bookSessionHandler = catchAsync(async (req: Request, res: Response) => {
  const { paymentMethod, receiptUrl } = req.body;
  const result = await bookingService.bookPrivateSession(
    req.user.id,
    String(req.params.availabilityId),
    { paymentMethod, receiptUrl }
  );

  successResponse({
    res,
    data: result,
    message: result.reusedPending
      ? 'You already have a pending payment for this session.'
      : 'Payment submitted. Your session will be confirmed after approval.',
    statusCode: 201,
  });
});
