import * as instructorClassService from './instructor-class.service.js';
import * as panelService from '../../instructor-panel/instructor-panel.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listMyCourses = catchAsync(async (req, res) => {
    const result = await panelService.getInstructorClasses(req.user.id, req.query);
    successResponse({ res, data: result.classes, message: 'Courses retrieved successfully', meta: result.pagination });
});
export const getStudents = catchAsync(async (req, res) => {
    const result = await instructorClassService.getEnrolledStudents(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Enrolled students retrieved' });
});
export const getAllStudents = catchAsync(async (req, res) => {
    const result = await instructorClassService.getAllEnrolledStudents(req.user.id);
    successResponse({ res, data: result, message: 'All enrolled students retrieved' });
});
//# sourceMappingURL=instructor-class.controller.js.map