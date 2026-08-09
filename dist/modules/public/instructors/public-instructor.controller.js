import * as instructorService from './public-instructor.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getInstructors = catchAsync(async (req, res) => {
    const result = await instructorService.getPublicInstructors(req.query);
    successResponse({ res, data: result.instructors, message: 'Instructors retrieved successfully', meta: result.pagination });
});
export const getInstructorSlots = catchAsync(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
    const result = await instructorService.getInstructorAvailableSlots(req.params.id, limit);
    successResponse({ res, data: result, message: 'Available slots retrieved' });
});
export const getInstructor = catchAsync(async (req, res) => {
    const result = await instructorService.getPublicInstructorProfile(req.params.id);
    successResponse({ res, data: result, message: 'Instructor profile retrieved' });
});
export const getCourses = catchAsync(async (req, res) => {
    const result = await instructorService.getInstructorCourses(req.params.id);
    successResponse({ res, data: result, message: 'Instructor courses retrieved' });
});
export const getReviews = catchAsync(async (req, res) => {
    const result = await instructorService.getInstructorReviews(req.params.id);
    successResponse({ res, data: result, message: 'Instructor reviews retrieved' });
});
//# sourceMappingURL=public-instructor.controller.js.map