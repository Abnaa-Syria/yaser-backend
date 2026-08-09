import * as sessionService from './instructor-session.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listSessions = catchAsync(async (req, res) => {
    const result = await sessionService.listCourseSessions(req.params.courseId, req.user.id);
    successResponse({ res, data: result, message: 'Sessions retrieved successfully' });
});
export const createSession = catchAsync(async (req, res) => {
    const result = await sessionService.createCourseSession(req.params.courseId, req.user.id, req.body);
    successResponse({ res, data: result, message: 'Session created successfully', statusCode: 201 });
});
export const updateSession = catchAsync(async (req, res) => {
    const result = await sessionService.updateCourseSession(req.params.courseId, req.params.sessionId, req.user.id, req.body);
    successResponse({ res, data: result, message: 'Session updated successfully' });
});
export const deleteSession = catchAsync(async (req, res) => {
    const result = await sessionService.deleteCourseSession(req.params.courseId, req.params.sessionId, req.user.id);
    successResponse({ res, data: result, message: 'Session deleted successfully' });
});
//# sourceMappingURL=instructor-session.controller.js.map