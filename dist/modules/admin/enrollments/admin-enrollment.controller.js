import * as adminEnrollmentService from './admin-enrollment.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getAllEnrollments = catchAsync(async (req, res) => {
    const { enrollments, pagination, stats } = await adminEnrollmentService.getAllEnrollments(req.query);
    successResponse({
        res,
        data: { enrollments, pagination, stats },
        results: enrollments.length,
        message: 'Enrollments fetched successfully',
    });
});
export const createEnrollment = catchAsync(async (req, res) => {
    const result = await adminEnrollmentService.createEnrollment(req.body);
    successResponse({
        res,
        data: result,
        message: 'Student enrolled successfully',
        statusCode: 201
    });
});
export const updateEnrollmentExpiry = catchAsync(async (req, res) => {
    const result = await adminEnrollmentService.updateEnrollmentExpiry(req.params.id, req.body.expiresAt ?? null);
    successResponse({ res, data: result, message: 'Enrollment expiry updated successfully' });
});
export const revokeEnrollment = catchAsync(async (req, res) => {
    const result = await adminEnrollmentService.revokeEnrollment(req.params.id);
    successResponse({ res, data: result, message: 'Enrollment access revoked successfully' });
});
//# sourceMappingURL=admin-enrollment.controller.js.map