import type { Prisma } from '@prisma/client';

/**
 * Creates CoursePurchase when a course payment is approved (idempotent).
 */
export async function ensureCoursePurchaseFromPaidPaymentTx(
  tx: Prisma.TransactionClient,
  studentId: string,
  courseId: string,
  paymentId: string
): Promise<boolean> {
  const existing = await tx.coursePurchase.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) return false;

  await tx.coursePurchase.create({
    data: { studentId, courseId, paymentId },
  });
  return true;
}
