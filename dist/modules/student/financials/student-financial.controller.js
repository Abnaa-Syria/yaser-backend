import * as financialService from './student-financial.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { AppError } from '../../../utils/AppError.js';
export const courseCheckout = catchAsync(async (req, res) => {
    const courseId = req.params.courseId;
    const result = await financialService.createCoursePurchasePayment(req.user.id, courseId, req.body);
    const message = result.reusedPending
        ? 'You already have a pending payment for this course.'
        : 'Course purchase submitted. Transfer funds and wait for approval.';
    successResponse({ res, data: result, message, statusCode: 201 });
});
export const packageCheckout = catchAsync(async (req, res) => {
    const packageId = req.params.packageId;
    const result = await financialService.createPackagePurchasePayment(req.user.id, packageId, req.body);
    const message = result.reusedPending
        ? 'You already have a pending payment for this package.'
        : 'Package purchase submitted. Transfer funds and wait for approval.';
    successResponse({ res, data: result, message, statusCode: 201 });
});
export const privateCheckout = catchAsync(async (req, res) => {
    const availabilityId = req.params.availabilityId;
    const result = await financialService.createPrivateSessionPayment(req.user.id, availabilityId, req.body);
    const message = result.reusedPending
        ? 'You already have a pending payment for this session.'
        : 'Private session payment submitted. Wait for approval.';
    successResponse({ res, data: result, message, statusCode: 201 });
});
export const getMyPayments = catchAsync(async (req, res) => {
    const result = await financialService.getMyPayments(req.user.id);
    successResponse({ res, data: result, message: 'Payments retrieved successfully' });
});
export const uploadPaymentProof = catchAsync(async (req, res) => {
    if (!req.file) {
        throw new AppError('No payment proof file uploaded.', 400);
    }
    const result = {
        receiptUrl: `/uploads/payment-proofs/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
    };
    successResponse({ res, data: result, message: 'Payment proof uploaded successfully', statusCode: 201 });
});
export const getMyPurchasedCourses = catchAsync(async (req, res) => {
    const result = await financialService.getMyPurchasedCourses(req.user.id);
    successResponse({ res, data: result, message: 'Purchased courses retrieved successfully' });
});
export const getMyPackageBalances = catchAsync(async (req, res) => {
    const result = await financialService.getMyPackageBalances(req.user.id);
    successResponse({ res, data: result, message: 'Purchased packages retrieved successfully' });
});
export const getMySubscriptions = getMyPackageBalances;
export const liveSessionCheckout = catchAsync(async (req, res) => {
    const liveSessionId = req.params.liveSessionId;
    const result = await financialService.createLiveSessionPurchasePayment(req.user.id, liveSessionId, req.body);
    const message = result.reusedPending
        ? 'You already have a pending payment for this live session.'
        : 'Live session booking submitted. Wait for approval.';
    successResponse({ res, data: result, message, statusCode: 201 });
});
//# sourceMappingURL=student-financial.controller.js.map