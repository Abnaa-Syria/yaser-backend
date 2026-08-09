import * as availabilityService from './instructor-availability.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { AppError } from '../../../utils/AppError.js';
export const listAvailabilityHandler = catchAsync(async (req, res) => {
    const result = await availabilityService.listMyAvailability(req.user.id);
    successResponse({ res, data: result, message: 'Availability slots retrieved' });
});
export const deleteAvailabilityHandler = catchAsync(async (req, res) => {
    const result = await availabilityService.deleteAvailabilitySlot(req.user.id, String(req.params.id));
    successResponse({ res, data: result, message: 'Availability slot removed' });
});
export const addAvailabilityHandler = catchAsync(async (req, res) => {
    const { startTime, endTime, price } = req.body;
    if (!startTime || !endTime) {
        throw new AppError('startTime and endTime are required.', 400);
    }
    const parsedPrice = price != null ? Number(price) : NaN;
    const result = await availabilityService.addAvailability(req.user.id, new Date(startTime), new Date(endTime), parsedPrice);
    successResponse({
        res,
        data: result,
        message: 'Availability slot added successfully.',
        statusCode: 201,
    });
});
export const updateAvailabilityPriceHandler = catchAsync(async (req, res) => {
    const parsedPrice = req.body?.price != null ? Number(req.body.price) : NaN;
    const result = await availabilityService.updateAvailabilitySlotPrice(req.user.id, String(req.params.id), parsedPrice);
    successResponse({ res, data: result, message: 'Availability slot updated.' });
});
//# sourceMappingURL=instructor-availability.controller.js.map