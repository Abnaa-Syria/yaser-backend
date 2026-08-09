import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as adminContactService from './admin-contact.service.js';
export const listSubmissions = catchAsync(async (req, res) => {
    const data = await adminContactService.listContactSubmissions(req.query);
    successResponse({ res, data, message: 'Contact submissions retrieved' });
});
export const updateSubmissionStatus = catchAsync(async (req, res) => {
    const data = await adminContactService.updateContactSubmissionStatus(req.params.id, req.body.status);
    successResponse({ res, data, message: 'Submission updated' });
});
//# sourceMappingURL=admin-contact.controller.js.map