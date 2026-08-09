import { Request, Response } from 'express';
import * as couponService from './student-coupon.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code, targetType, targetId } = req.body;
  const result = await couponService.validateCoupon(req.user.id, code, targetType, targetId);
  successResponse({ res, data: result, message: 'Coupon validated successfully' });
});
