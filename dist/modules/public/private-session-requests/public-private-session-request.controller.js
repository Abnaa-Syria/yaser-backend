import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './public-private-session-request.service.js';
export const submitPrivateSessionRequest = catchAsync(async (req, res) => {
    const studentId = req.user?.id;
    const data = await service.createPrivateSessionRequest({
        ...req.body,
        studentId,
    });
    successResponse({
        res,
        data: { id: data.id },
        message: 'Request received. We will contact you soon.',
        statusCode: 201,
    });
});
//# sourceMappingURL=public-private-session-request.controller.js.map