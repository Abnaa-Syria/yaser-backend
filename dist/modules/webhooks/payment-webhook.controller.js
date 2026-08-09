import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as webhookService from './payment-webhook.service.js';
export const handlePaymentWebhook = catchAsync(async (req, res) => {
    const gatewayEventId = req.headers['x-webhook-id'] ||
        req.body?.id ||
        req.body?.gatewayEventId;
    if (!gatewayEventId) {
        return successResponse({
            res,
            data: { accepted: false },
            message: 'Missing gateway event id',
            statusCode: 400,
        });
    }
    const result = await webhookService.ingestPaymentWebhook({
        gatewayEventId,
        gatewayProvider: String(req.params.provider),
        eventType: req.body?.type,
        payload: req.body,
        paymentId: req.body?.paymentId,
    });
    successResponse({
        res,
        data: result,
        message: result.duplicate ? 'Event already processed' : 'Webhook processed',
    });
});
//# sourceMappingURL=payment-webhook.controller.js.map