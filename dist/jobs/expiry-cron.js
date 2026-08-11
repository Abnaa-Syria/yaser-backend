import { prisma } from '../prisma.js';
/**
 * Mark expired user subscriptions as EXPIRED when endDate < now.
 * CoursePurchase access is date-gated via expiresAt (no status column).
 */
export async function runExpirySweep() {
    const now = new Date();
    const subscriptionResult = await prisma.userSubscription.updateMany({
        where: {
            endDate: { lt: now },
            status: { in: ['ACTIVE', 'PENDING_PAYMENT'] },
        },
        data: { status: 'EXPIRED' },
    });
    return {
        subscriptionsExpired: subscriptionResult.count || 0,
        ranAt: now.toISOString(),
    };
}
export function startExpiryCron() {
    const enabled = process.env.ENABLE_EXPIRY_CRON !== 'false';
    if (!enabled) {
        console.info('[expiry-cron] disabled via ENABLE_EXPIRY_CRON=false');
        return;
    }
    const intervalMs = Number(process.env.EXPIRY_CRON_INTERVAL_MS || 60 * 60 * 1000);
    const tick = async () => {
        try {
            const result = await runExpirySweep();
            if (result.subscriptionsExpired) {
                console.info('[expiry-cron]', result);
            }
        }
        catch (err) {
            console.error('[expiry-cron] failed', err);
        }
    };
    void tick();
    setInterval(tick, intervalMs);
    console.info(`[expiry-cron] started (every ${intervalMs}ms)`);
}
//# sourceMappingURL=expiry-cron.js.map