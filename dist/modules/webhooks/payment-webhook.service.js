import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { WebhookEventStatus } from '@prisma/client';
export const ingestPaymentWebhook = async (input) => {
    const existing = await prisma.paymentWebhookEvent.findUnique({
        where: { gatewayEventId: input.gatewayEventId },
    });
    if (existing?.status === 'PROCESSED') {
        return { duplicate: true, event: existing };
    }
    const event = existing
        ? await prisma.paymentWebhookEvent.update({
            where: { id: existing.id },
            data: {
                payload: input.payload,
                gatewayProvider: input.gatewayProvider,
                eventType: input.eventType,
                paymentId: input.paymentId,
            },
        })
        : await prisma.paymentWebhookEvent.create({
            data: {
                gatewayEventId: input.gatewayEventId,
                gatewayProvider: input.gatewayProvider,
                eventType: input.eventType,
                payload: input.payload,
                paymentId: input.paymentId,
                status: WebhookEventStatus.PENDING,
            },
        });
    try {
        if (input.paymentId) {
            await prisma.payment.update({
                where: { id: input.paymentId },
                data: { status: 'PAID', paidAt: new Date() },
            });
        }
        const processed = await prisma.paymentWebhookEvent.update({
            where: { id: event.id },
            data: { status: WebhookEventStatus.PROCESSED, processedAt: new Date() },
        });
        return { duplicate: false, event: processed };
    }
    catch (error) {
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
//# sourceMappingURL=payment-webhook.service.js.map