import { Request, Response } from 'express';
import crypto from 'crypto';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as webhookService from './payment-webhook.service.js';

const timingSafeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyWebhookSignature = (req: Request) => {
  const secret = process.env.WEBHOOK_SECRET || '';
  if (!secret) return false;

  const provided =
    (req.headers['x-webhook-signature'] as string) ||
    (req.headers['x-signature'] as string) ||
    '';

  if (!provided) return false;

  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body ?? {});

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const normalized = provided.replace(/^sha256=/i, '');
  return timingSafeEqual(normalized, expected);
};

export const handlePaymentWebhook = catchAsync(async (req: Request, res: Response) => {
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

  const gatewayEventId =
    (req.headers['x-webhook-id'] as string) ||
    (req.body?.id as string) ||
    (req.body?.gatewayEventId as string);

  if (!gatewayEventId) {
    return successResponse({
      res,
      data: { accepted: false },
      message: 'Missing gateway event id',
      statusCode: 400,
    });
  }

  // Do not auto-fulfill enrollment from unsigned/generic payloads.
  // Store the event only; admin approval remains the access path.
  const result = await webhookService.ingestPaymentWebhook({
    gatewayEventId,
    gatewayProvider: String(req.params.provider),
    eventType: req.body?.type as string | undefined,
    payload: req.body,
    paymentId: undefined,
  });

  successResponse({
    res,
    data: result,
    message: result.duplicate ? 'Event already processed' : 'Webhook recorded',
  });
});
