import { Request, Response } from 'express';
import * as couponService from './admin-coupon.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.createCoupon(req.body);
  successResponse({ res, data: result, message: 'Coupon created successfully', statusCode: 201 });
});

export const getCoupons = catchAsync(async (req: Request, res: Response) => {
  const data = await couponService.getCoupons(req.query);
  successResponse({ res, data, results: (data as any).coupons.length });
});

export const getCoupon = catchAsync(async (req: Request, res: Response) => {
  const data = await couponService.getCouponById(req.params.id as string);
  successResponse({ res, data });
});

export const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.updateCoupon(req.params.id as string, req.body);
  successResponse({ res, data: result, message: 'Coupon updated successfully' });
});

export const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.deleteCoupon(req.params.id as string);
  successResponse({ res, data: result, message: 'Coupon deleted successfully' });
});

export const getUsage = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.getCouponUsageHistory(req.params.id as string);
  successResponse({ res, data: result, message: 'Usage history retrieved' });
});
