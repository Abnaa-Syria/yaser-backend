import crypto from 'crypto';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as webhookService from './payment-webhook.service.js';
const timingSafeEqual = (a, b) => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length)
        return false;
    return crypto.timingSafeEqual(bufA, bufB);
};
const verifyWebhookSignature = (req) => {
    const secret = process.env.WEBHOOK_SECRET || '';
    if (!secret)
        return false;
    const provided = req.headers['x-webhook-signature'] ||
        req.headers['x-signature'] ||
        '';
    if (!provided)
        return false;
    const rawBody = typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {});
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const normalized = provided.replace(/^sha256=/i, '');
    return timingSafeEqual(normalized, expected);
};
export const handlePaymentWebhook = catchAsync(async (req, res) => {
    const enabled = process.env.WEBHOOKS_ENABLED === 'true';
    if (!enabled) {
        throw new AppError('Payment webhooks are disabled', 503);
    }
    if (!process.env.WEBHOOK_SECRET) {
        throw new AppError('WEBHOOK_SECRET is not configured', 503);
    }
    if (!verifyWebhookSignature(req)) {
        throw new AppError('Invalid webhook signature', 401);
    }
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
    const paymentId = req.headers['x-payment-id'] ||
        req.body?.paymentId ||
        req.body?.payment_id ||
        undefined;
    // Do not auto-fulfill enrollment — store and link the event for admin audit trails.
    const result = await webhookService.ingestPaymentWebhook({
        gatewayEventId,
        gatewayProvider: String(req.params.provider),
        eventType: req.body?.type,
        payload: req.body,
        paymentId,
    });
    successResponse({
        res,
        data: result,
        message: result.duplicate ? 'Event already processed' : 'Webhook recorded',
    });
});
//# sourceMappingURL=payment-webhook.controller.js.map