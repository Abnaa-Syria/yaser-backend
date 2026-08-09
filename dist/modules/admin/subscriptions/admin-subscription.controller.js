import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as subscriptionService from './admin-subscription.service.js';
export const getSubscriptions = catchAsync(async (_req, res) => {
    const data = await subscriptionService.getAllSubscriptions();
    successResponse({ res, data });
});
export const updateSubscriptionStatus = catchAsync(async (req, res) => {
    const data = await subscriptionService.updateSubscriptionStatus(req.params.id, req.body.status);
    successResponse({ res, data, message: 'Subscription status updated successfully' });
});
export const createSubscription = catchAsync(async (req, res) => {
    const data = await subscriptionService.createSubscription(req.body);
    successResponse({ res, data, message: 'Subscription created successfully', statusCode: 201 });
});
export const getEnrollments = catchAsync(async (_req, res) => {
    const data = await subscriptionService.getAllEnrollments();
    successResponse({ res, data });
});
export const createEnrollment = catchAsync(async (req, res) => {
    const data = await subscriptionService.createEnrollment(req.body);
    successResponse({ res, data, message: 'Enrollment created successfully', statusCode: 201 });
});
export const getLookupData = catchAsync(async (_req, res) => {
    const data = await subscriptionService.getLookups();
    successResponse({ res, data });
});
//# sourceMappingURL=admin-subscription.controller.js.map