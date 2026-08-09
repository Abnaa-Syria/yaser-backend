import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const getOrCreateWallet = async (instructorId) => {
    let wallet = await prisma.wallet.findUnique({
        where: { instructorId },
    });
    if (!wallet) {
        wallet = await prisma.wallet.create({
            data: { instructorId },
        });
    }
    return wallet;
};
export const getTransactions = async (instructorId, pageRaw, limitRaw) => {
    const wallet = await getOrCreateWallet(instructorId);
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.walletTransaction.count({
            where: { walletId: wallet.id },
        }),
    ]);
    return {
        transactions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};
export const getPayoutRequests = async (instructorId) => {
    return await prisma.payoutRequest.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
    });
};
export const createPayoutRequest = async (instructorId, data) => {
    const { amount, payoutMethod, payoutDetails } = data;
    if (amount <= 0) {
        throw new AppError('Amount must be greater than zero', 400);
    }
    // Ensure wallet exists before proceeding
    await getOrCreateWallet(instructorId);
    return await prisma.$transaction(async (tx) => {
        // Atomically deduct the amount ONLY if the current balance is sufficient.
        // This row-level lock prevents race conditions from concurrent requests.
        const updateResult = await tx.wallet.updateMany({
            where: {
                instructorId,
                balance: {
                    gte: amount,
                },
            },
            data: {
                balance: {
                    decrement: amount,
                },
            },
        });
        if (updateResult.count === 0) {
            throw new AppError('Insufficient funds or concurrent request error', 400);
        }
        // Since the decrement succeeded, we safely create the payout request
        const payout = await tx.payoutRequest.create({
            data: {
                instructorId,
                amount,
                status: 'PENDING',
                payoutMethod: data.payoutMethod,
                payoutDetails: data.payoutDetails,
            },
        });
        const wallet = await tx.wallet.findUnique({ where: { instructorId } });
        if (wallet) {
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount,
                    description: `Payout request submitted — pending review (ID: ${payout.id})`,
                },
            });
        }
        return payout;
    });
};
//# sourceMappingURL=instructor-wallet.service.js.map