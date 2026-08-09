import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './admin-instructor-application.service.js';
export const listInstructorApplications = catchAsync(async (req, res) => {
    const data = await service.listInstructorApplications(req.query);
    successResponse({ res, data, results: data.length });
});
export const getInstructorApplication = catchAsync(async (req, res) => {
    const data = await service.getInstructorApplication(req.params.id);
    successResponse({ res, data });
});
export const updateInstructorApplication = catchAsync(async (req, res) => {
    const data = await service.updateInstructorApplication(req.params.id, req.user?.id, req.body);
    successResponse({ res, data, message: 'Instructor application updated successfully' });
});
//# sourceMappingURL=admin-instructor-application.controller.js.map