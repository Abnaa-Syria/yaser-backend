import * as adminStudentService from './admin-student.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getStudentPerformance = catchAsync(async (req, res) => {
    const result = await adminStudentService.getStudentPerformanceForAdmin(req.params.id);
    successResponse({ res, data: result, message: 'Student performance retrieved' });
});
export const getStudentAttendance = catchAsync(async (req, res) => {
    const result = await adminStudentService.getStudentAttendanceForAdmin(req.params.id);
    successResponse({ res, data: result, message: 'Student attendance retrieved' });
});
//# sourceMappingURL=admin-student.controller.js.map