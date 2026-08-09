import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as payoutService from './admin-payout.service.js';
export const updateCommission = catchAsync(async (req, res) => {
    const { instructorId } = req.params;
    const { commissionRate } = req.body;
    const data = await payoutService.updateCommission(instructorId, commissionRate);
    return successResponse({
        res,
        data,
        message: 'Commission rate updated successfully'
    });
});
export const getPayoutRequests = catchAsync(async (req, res) => {
    const data = await payoutService.getPayoutRequests(req.query);
    successResponse({ res, data, results: data.payouts.length });
});
export const getPayout = catchAsync(async (req, res) => {
    const data = await payoutService.getPayoutById(req.params.id);
    successResponse({ res, data });
});
export const processPayout = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    let receiptUrl = undefined;
    if (req.file) {
        receiptUrl = `/uploads/payouts/${req.file.filename}`;
    }
    const data = await payoutService.processPayout(id, status, adminNotes, req.user.id, receiptUrl);
    return successResponse({
        res,
        data,
        message: `Payout request marked as ${status}`,
    });
});
//# sourceMappingURL=admin-payout.controller.js.map