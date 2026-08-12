import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { WebhookEventStatus } from '@prisma/client';

function extractPaymentId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const body = payload as Record<string, unknown>;
  const metadata =
    body.metadata && typeof body.metadata === 'object'
      ? (body.metadata as Record<string, unknown>)
      : null;
  const data = body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : null;

  const candidates = [
    body.paymentId,
    body.payment_id,
    metadata?.paymentId,
    metadata?.payment_id,
    data?.paymentId,
    data?.payment_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

export const ingestPaymentWebhook = async (input: {
  gatewayEventId: string;
  gatewayProvider?: string;
  eventType?: string;
  payload: unknown;
  paymentId?: string;
}) => {
  const linkedPaymentId = input.paymentId || extractPaymentId(input.payload);

  if (linkedPaymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: linkedPaymentId },
      select: { id: true },
    });
    if (!payment) {
      throw new AppError(`Linked payment ${linkedPaymentId} was not found`, 404);
    }
  }

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { gatewayEventId: input.gatewayEventId },
  });

  if (existing?.status === 'PROCESSED') {
    return { duplicate: true, event: existing, linkedPaymentId: existing.paymentId };
  }

  const event = existing
    ? await prisma.paymentWebhookEvent.update({
        where: { id: existing.id },
        data: {
          payload: input.payload as object,
          gatewayProvider: input.gatewayProvider,
          eventType: input.eventType,
          paymentId: linkedPaymentId || null,
        },
      })
    : await prisma.paymentWebhookEvent.create({
        data: {
          gatewayEventId: input.gatewayEventId,
          gatewayProvider: input.gatewayProvider,
          eventType: input.eventType,
          payload: input.payload as object,
          paymentId: linkedPaymentId || null,
          status: WebhookEventStatus.PENDING,
        },
      });

  try {
    // Manual proof-of-payment remains admin-driven; webhooks provide audit linkage only.
    const processed = await prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: { status: WebhookEventStatus.PROCESSED, processedAt: new Date() },
    });

    return { duplicate: false, event: processed, linkedPaymentId: processed.paymentId };
  } catch (error) {
    await prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: WebhookEventStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw new AppError('Webhook processing failed', 500);
  }
};
