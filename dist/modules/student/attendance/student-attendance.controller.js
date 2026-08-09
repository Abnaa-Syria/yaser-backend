import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as attendanceService from './student-attendance.service.js';
export const getMyAttendance = catchAsync(async (req, res) => {
    const result = await attendanceService.getMyAttendance(req.user.id);
    successResponse({ res, data: result, message: 'Attendance report retrieved' });
});
//# sourceMappingURL=student-attendance.controller.js.map