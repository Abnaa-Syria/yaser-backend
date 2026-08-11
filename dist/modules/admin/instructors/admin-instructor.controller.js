import * as adminService from './admin-instructor.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const createInstructor = catchAsync(async (req, res) => {
    const result = await adminService.createInstructor(req.body);
    successResponse({ res, data: result, message: 'Instructor created successfully', statusCode: 201 });
});
export const getAllInstructors = catchAsync(async (req, res) => {
    const result = await adminService.getAllInstructors(req.query);
    successResponse({
        res,
        data: result.instructors,
        message: 'Instructors retrieved successfully',
        meta: result.pagination
    });
});
export const getInstructor = catchAsync(async (req, res) => {
    const result = await adminService.getInstructorById(req.params.id);
    successResponse({ res, data: result, message: 'Instructor details retrieved' });
});
export const getInstructorPerformance = catchAsync(async (req, res) => {
    const result = await adminService.getInstructorPerformanceForAdmin(req.params.id);
    successResponse({ res, data: result, message: 'Instructor performance retrieved' });
});
export const getInstructorAvailability = catchAsync(async (req, res) => {
    const result = await adminService.getInstructorAvailabilityForAdmin(req.params.id);
    successResponse({ res, data: result, message: 'Instructor availability retrieved' });
});
export const createInstructorAvailability = catchAsync(async (req, res) => {
    const result = await adminService.createInstructorAvailabilityForAdmin(req.params.id, req.body);
    successResponse({ res, data: result, message: 'Availability slot created', statusCode: 201 });
});
export const deleteInstructorAvailability = catchAsync(async (req, res) => {
    const result = await adminService.deleteInstructorAvailabilityForAdmin(req.params.id, req.params.slotId);
    successResponse({ res, data: result, message: 'Availability slot deleted' });
});
export const updateInstructorAvailabilityPrice = catchAsync(async (req, res) => {
    const result = await adminService.updateInstructorAvailabilityPriceForAdmin(req.params.id, req.params.slotId, Number(req.body.price));
    successResponse({ res, data: result, message: 'Availability slot updated' });
});
export const updateInstructor = catchAsync(async (req, res) => {
    const result = await adminService.updateInstructor(req.params.id, req.body);
    successResponse({ res, data: result, message: 'Instructor updated successfully' });
});
export const deleteInstructor = catchAsync(async (req, res) => {
    const result = await adminService.deleteInstructor(req.params.id);
    successResponse({ res, data: result, message: 'Instructor deleted successfully' });
});
//# sourceMappingURL=admin-instructor.controller.js.map