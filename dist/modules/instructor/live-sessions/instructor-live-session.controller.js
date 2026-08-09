import * as liveSessionService from './instructor-live-session.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listMyLiveSessions = catchAsync(async (req, res) => {
    const data = await liveSessionService.listInstructorLiveSessions(req.user.id);
    successResponse({ res, data, results: data.length });
});
export const createMyLiveSession = catchAsync(async (req, res) => {
    const data = await liveSessionService.createInstructorLiveSession(req.user.id, req.body);
    successResponse({ res, data, message: 'Live session scheduled successfully.', statusCode: 201 });
});
export const updateMyLiveSession = catchAsync(async (req, res) => {
    const data = await liveSessionService.updateInstructorLiveSession(req.params.id, req.user.id, req.body);
    successResponse({ res, data, message: 'Live session updated successfully.' });
});
export const deleteMyLiveSession = catchAsync(async (req, res) => {
    const data = await liveSessionService.deleteInstructorLiveSession(req.params.id, req.user.id);
    successResponse({ res, data, message: 'Live session deleted successfully.' });
});
//# sourceMappingURL=instructor-live-session.controller.js.map