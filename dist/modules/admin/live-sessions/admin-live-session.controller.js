import * as liveSessionService from './admin-live-session.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listLiveSessions = catchAsync(async (req, res) => {
    const data = await liveSessionService.listAllLiveSessions(req.query);
    successResponse({ res, data, results: data.length });
});
export const createLiveSession = catchAsync(async (req, res) => {
    const data = await liveSessionService.createLiveSession(req.body);
    successResponse({ res, data, message: 'Live session scheduled successfully.', statusCode: 201 });
});
export const updateLiveSession = catchAsync(async (req, res) => {
    const data = await liveSessionService.updateLiveSession(req.params.id, req.body);
    successResponse({ res, data, message: 'Live session updated successfully.' });
});
export const deleteLiveSession = catchAsync(async (req, res) => {
    const data = await liveSessionService.deleteLiveSession(req.params.id);
    successResponse({ res, data, message: 'Live session deleted successfully.' });
});
//# sourceMappingURL=admin-live-session.controller.js.map