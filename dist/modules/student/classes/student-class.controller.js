import * as classService from './student-class.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getMyClasses = catchAsync(async (req, res) => {
    const result = await classService.getMyClasses(req.user.id);
    successResponse({ res, data: result, message: 'Classes retrieved successfully' });
});
export const getClass = catchAsync(async (req, res) => {
    const result = await classService.getClassDetails(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Class details retrieved' });
});
export const enroll = catchAsync(async (req, res) => {
    const result = await classService.enrollInClass(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Enrolled successfully', statusCode: 201 });
});
export const unenroll = catchAsync(async (req, res) => {
    const result = await classService.unenrollFromClass(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Unenrolled successfully' });
});
//# sourceMappingURL=student-class.controller.js.map