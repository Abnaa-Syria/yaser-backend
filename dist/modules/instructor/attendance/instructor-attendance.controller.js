import * as attendanceService from './instructor-attendance.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listSessions = catchAsync(async (req, res) => {
    const { courseId, status, page, limit } = req.query;
    const result = await attendanceService.listSessionsForAttendance(req.user.id, {
        courseId: courseId,
        status: status,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    successResponse({
        res,
        data: result.sessions,
        message: 'Sessions retrieved successfully',
        meta: result.pagination,
    });
});
export const getSessionDetail = catchAsync(async (req, res) => {
    const result = await attendanceService.getSessionAttendanceDetail(req.user.id, req.params.sessionId);
    successResponse({ res, data: result, message: 'Session attendance retrieved successfully' });
});
export const markAttendance = catchAsync(async (req, res) => {
    const { present } = req.body;
    const result = await attendanceService.markSessionAttendance(req.user.id, req.params.sessionId, req.params.studentId, present);
    successResponse({ res, data: result, message: 'Attendance updated successfully' });
});
//# sourceMappingURL=instructor-attendance.controller.js.map