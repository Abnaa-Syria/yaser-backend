import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as auditService from './admin-audit-log.service.js';
export const getAuditLogs = catchAsync(async (req, res) => {
    const data = await auditService.listAuditLogs(req.query);
    successResponse({ res, data });
});
//# sourceMappingURL=admin-audit-log.controller.js.map