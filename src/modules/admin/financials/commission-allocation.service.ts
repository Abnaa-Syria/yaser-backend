import type { InstructorCreditReason, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma.js';

export type PaymentCreditInput = {
  id: string;
  amount: number;
  courseId: string | null;
  availabilityId: string | null;
};

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function walletSourceKey(paymentId: string, reason: InstructorCreditReason) {
  return `${paymentId}:${reason}`;
}

async function creditInstructorTx(
  tx: Prisma.TransactionClient,
  params: {
    paymentId: string;
    instructorId: string;
    grossAmount: number;
    reason: InstructorCreditReason;
  }
) {
  const { paymentId, instructorId, grossAmount, reason } = params;
  if (grossAmount <= 0) return;

  const existing = await tx.paymentInstructorCredit.findFirst({
    where: {
      paymentId,
      instructorId,
      reason,
    },
  });
  if (existing) return;

  const instructor = await tx.user.findUnique({
    where: { id: instructorId },
    select: { role: { select: { name: true } }, commissionRate: true },
  });
  if (!instructor || !['INSTRUCTOR', 'SUPER_ADMIN', 'ADMIN'].includes(instructor.role.name)) return;

  const ratePct = Math.min(100, Math.max(0, instructor.commissionRate ?? 80));
  const earningAmount = roundMoney((grossAmount * ratePct) / 100);
  if (earningAmount <= 0) return;

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
      sourcePaymentId: walletSourceKey(paymentId, reason),
    },
  });

  await tx.paymentInstructorCredit.create({
    data: {
      paymentId,
      instructorId,
      amount: earningAmount,
      rateApplied: ratePct,
      reason,
      walletTransactionId: walletTx.id,
    },
  });
}

/** Allocates instructor wallet credits when a payment is fulfilled. */
export async function allocatePaymentCommissionsTx(
  tx: Prisma.TransactionClient,
  payment: PaymentCreditInput
): Promise<void> {
  if (payment.amount <= 0) return;

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

  if (!payment.courseId) return;

  const course = await tx.course.findUnique({
    where: { id: payment.courseId },
    select: { instructorId: true },
  });
  if (!course?.instructorId) return;

  await creditInstructorTx(tx, {
    paymentId: payment.id,
    instructorId: course.instructorId,
    grossAmount: payment.amount,
    reason: 'COURSE_RECORDED',
  });
}

/** @deprecated Live-session commission hooks removed. */
export async function allocateLiveCommissionsForCoursePayment(_paymentId: string) {
  return;
}
