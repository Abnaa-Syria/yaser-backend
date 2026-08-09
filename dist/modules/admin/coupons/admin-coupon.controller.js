import * as couponService from './admin-coupon.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const createCoupon = catchAsync(async (req, res) => {
    const result = await couponService.createCoupon(req.body);
    successResponse({ res, data: result, message: 'Coupon created successfully', statusCode: 201 });
});
export const getCoupons = catchAsync(async (req, res) => {
    const data = await couponService.getCoupons(req.query);
    successResponse({ res, data, results: data.coupons.length });
});
export const getCoupon = catchAsync(async (req, res) => {
    const data = await couponService.getCouponById(req.params.id);
    successResponse({ res, data });
});
export const updateCoupon = catchAsync(async (req, res) => {
    const result = await couponService.updateCoupon(req.params.id, req.body);
    successResponse({ res, data: result, message: 'Coupon updated successfully' });
});
export const deleteCoupon = catchAsync(async (req, res) => {
    const result = await couponService.deleteCoupon(req.params.id);
    successResponse({ res, data: result, message: 'Coupon deleted successfully' });
});
export const getUsage = catchAsync(async (req, res) => {
    const result = await couponService.getCouponUsageHistory(req.params.id);
    successResponse({ res, data: result, message: 'Usage history retrieved' });
});
//# sourceMappingURL=admin-coupon.controller.js.map