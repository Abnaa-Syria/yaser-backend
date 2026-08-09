import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { getRoleName } from '../../../utils/role-query.js';
import { logAudit } from '../../../services/audit-logger.service.js';
export const updateCommission = async (instructorId, commissionRate) => {
    const user = await prisma.user.findUnique({
        where: { id: instructorId },
        include: { role: true },
    });
    if (!user || getRoleName(user) !== 'INSTRUCTOR') {
        throw new AppError('Instructor not found', 404);
    }
    return await prisma.user.update({
        where: { id: instructorId },
        data: { commissionRate },
    });
};
export const getPayoutRequests = async (query) => {
    const { page = 1, limit = 10, status, instructorId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (instructorId)
        where.instructorId = instructorId;
    const [payouts, total] = await Promise.all([
        prisma.payoutRequest.findMany({
            where,
            skip,
            take: Number(limit),
            include: {
                instructor: {
                    select: { id: true, fullName: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.payoutRequest.count({ where }),
    ]);
    return { payouts, total, page: Number(page), limit: Number(limit) };
};
export const getPayoutById = async (id) => {
    const payout = await prisma.payoutRequest.findUnique({
        where: { id },
        include: {
            instructor: {
                include: { wallet: true }
            }
        }
    });
    if (!payout)
        throw new AppError('Payout request not found', 404);
    return payout;
};
export const processPayout = async (payoutId, status, adminNotes, actorId, receiptUrl) => {
    const result = await prisma.$transaction(async (tx) => {
        const payout = await tx.payoutRequest.findUnique({
            where: { id: payoutId },
            include: { instructor: { include: { wallet: true } } },
        });
        if (!payout)
            throw new AppError('Payout request not found', 404);
        if (payout.status === 'PAID')
            throw new AppError('Payout already processed as PAID', 400);
        if (payout.status === 'REJECTED')
            throw new AppError('Payout already rejected', 400);
        const wallet = payout.instructor.wallet;
        if (!wallet)
            throw new AppError('Instructor wallet not found', 404);
        const updatedPayout = await tx.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status,
                adminNotes,
                receiptUrl,
                processedAt: status === 'PAID' || status === 'REJECTED' ? new Date() : null,
            },
        });
        // Funds are reserved when the instructor submits the request (balance already decremented).
        if (status === 'REJECTED') {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: payout.amount } },
            });
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'EARNING',
                    amount: payout.amount,
                    description: `Payout request rejected — funds returned (ID: ${payoutId})`,
                },
            });
        }
        if (status === 'PAID') {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { totalWithdrawn: { increment: payout.amount } },
            });
        }
        return updatedPayout;
    });
    await logAudit({
        userId: actorId,
        action: 'PAYOUT_PROCESSED',
        entityType: 'PAYOUT',
        entityId: payoutId,
        details: { status, adminNotes },
    });
    return result;
};
//# sourceMappingURL=admin-payout.service.js.map