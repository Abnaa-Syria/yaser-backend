import { prisma } from '../../../prisma.js';
const HYBRID_RECORDED_SHARE = 0.4;
const HYBRID_LIVE_SHARE = 0.6;
function roundMoney(n) {
    return Math.round(n * 100) / 100;
}
/** One wallet row per payment credit line (recorded vs each live session). */
function walletSourceKey(paymentId, reason, liveSessionId) {
    return liveSessionId ? `${paymentId}:${reason}:${liveSessionId}` : `${paymentId}:${reason}`;
}
async function creditInstructorTx(tx, params) {
    const { paymentId, instructorId, grossAmount, reason, liveSessionId = null } = params;
    if (grossAmount <= 0)
        return;
    const existing = await tx.paymentInstructorCredit.findFirst({
        where: {
            paymentId,
            instructorId,
            reason,
            liveSessionId,
        },
    });
    if (existing)
        return;
    const instructor = await tx.user.findUnique({
        where: { id: instructorId },
        select: { role: { select: { name: true } }, commissionRate: true },
    });
    if (!instructor || instructor.role.name !== 'INSTRUCTOR')
        return;
    const ratePct = Math.min(100, Math.max(0, instructor.commissionRate ?? 80));
    const earningAmount = roundMoney((grossAmount * ratePct) / 100);
    if (earningAmount <= 0)
        return;
    let wallet = await tx.wallet.findUnique({ where: { instructorId } });
    if (!wallet) {
        wallet = await tx.wallet.create({ data: { instructorId } });
    }
    await tx.wallet.update({
        where: { id: wallet.id },
        data: {
            balance: { increment: earningAmount },
            totalEarned: { increment: earningAmount },
        },
    });
    const walletTx = await tx.walletTransaction.create({
        data: {
            walletId: wallet.id,
            type: 'EARNING',
            amount: earningAmount,
            description: `Payment ${paymentId} — ${reason} (${ratePct}%)`,
            sourcePaymentId: walletSourceKey(paymentId, reason, liveSessionId),
        },
    });
    await tx.paymentInstructorCredit.create({
        data: {
            paymentId,
            instructorId,
            amount: earningAmount,
            rateApplied: ratePct,
            reason,
            liveSessionId,
            walletTransactionId: walletTx.id,
        },
    });
}
/**
 * Allocates instructor wallet credits when a payment is fulfilled.
 */
export async function allocatePaymentCommissionsTx(tx, payment) {
    if (payment.amount <= 0)
        return;
    if (payment.availabilityId) {
        const slot = await tx.instructorAvailability.findUnique({
            where: { id: payment.availabilityId },
            select: { instructorId: true },
        });
        if (slot) {
            await creditInstructorTx(tx, {
                paymentId: payment.id,
                instructorId: slot.instructorId,
                grossAmount: payment.amount,
                reason: 'PRIVATE_SESSION',
            });
        }
        return;
    }
    if (payment.liveSessionId) {
        const session = await tx.liveSession.findUnique({
            where: { id: payment.liveSessionId },
            select: { instructorId: true },
        });
        if (session) {
            await creditInstructorTx(tx, {
                paymentId: payment.id,
                instructorId: session.instructorId,
                grossAmount: payment.amount,
                reason: 'PRIVATE_SESSION',
            });
        }
        return;
    }
    if (!payment.courseId)
        return;
    const course = await tx.course.findUnique({
        where: { id: payment.courseId },
        select: { type: true, instructorId: true },
    });
    if (!course)
        return;
    if (course.type === 'RECORDED') {
        if (course.instructorId) {
            await creditInstructorTx(tx, {
                paymentId: payment.id,
                instructorId: course.instructorId,
                grossAmount: payment.amount,
                reason: 'COURSE_RECORDED',
            });
        }
        return;
    }
    // HYBRID — recorded portion to primary instructor
    const recordedGross = roundMoney(payment.amount * HYBRID_RECORDED_SHARE);
    if (course.instructorId && recordedGross > 0) {
        await creditInstructorTx(tx, {
            paymentId: payment.id,
            instructorId: course.instructorId,
            grossAmount: recordedGross,
            reason: 'COURSE_RECORDED',
        });
    }
    const liveGross = roundMoney(payment.amount * HYBRID_LIVE_SHARE);
    if (liveGross <= 0)
        return;
    const sessions = await tx.liveSession.findMany({
        where: { courseId: payment.courseId, type: 'GROUP' },
        select: { id: true, instructorId: true },
    });
    if (!sessions.length)
        return;
    const perSessionGross = roundMoney(liveGross / sessions.length);
    for (const session of sessions) {
        await creditInstructorTx(tx, {
            paymentId: payment.id,
            instructorId: session.instructorId,
            grossAmount: perSessionGross,
            reason: 'COURSE_LIVE_SESSION',
            liveSessionId: session.id,
        });
    }
}
/** Re-run live commission when new GROUP sessions are scheduled (HYBRID courses). */
export async function allocateLiveCommissionsForCoursePayment(paymentId) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, amount: true, courseId: true, status: true, liveSessionId: true, availabilityId: true },
    });
    if (!payment || payment.status !== 'PAID' || !payment.courseId)
        return;
    const course = await prisma.course.findUnique({
        where: { id: payment.courseId },
        select: { type: true, instructorId: true },
    });
    if (course?.type !== 'HYBRID')
        return;
    const liveGross = roundMoney(payment.amount * HYBRID_LIVE_SHARE);
    if (liveGross <= 0)
        return;
    const sessions = await prisma.liveSession.findMany({
        where: { courseId: payment.courseId, type: 'GROUP' },
        select: { id: true, instructorId: true },
    });
    if (!sessions.length)
        return;
    const perSessionGross = roundMoney(liveGross / sessions.length);
    await prisma.$transaction(async (tx) => {
        for (const session of sessions) {
            await creditInstructorTx(tx, {
                paymentId: payment.id,
                instructorId: session.instructorId,
                grossAmount: perSessionGross,
                reason: 'COURSE_LIVE_SESSION',
                liveSessionId: session.id,
            });
        }
    });
}
//# sourceMappingURL=commission-allocation.service.js.map