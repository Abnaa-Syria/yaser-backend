import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './admin-private-session-request.service.js';
export const listRequests = catchAsync(async (req, res) => {
    const result = await service.listPrivateSessionRequests(req.query);
    successResponse({
        res,
        data: result.requests,
        message: 'Private session requests retrieved',
        meta: { total: result.total, page: result.page, limit: result.limit },
    });
});
export const updateRequest = catchAsync(async (req, res) => {
    const data = await service.updatePrivateSessionRequest(req.params.id, req.body);
    successResponse({ res, data, message: 'Request updated' });
});
//# sourceMappingURL=admin-private-session-request.controller.js.map