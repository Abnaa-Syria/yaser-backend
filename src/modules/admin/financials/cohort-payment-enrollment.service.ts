import type { Prisma } from '@prisma/client';

/** @deprecated Cohorts removed — delegates to course purchase fulfillment. */
export async function ensureCohortEnrollmentFromPaidPaymentTx(
  tx: Prisma.TransactionClient,
  studentId: string,
  courseId: string | null
): Promise<boolean> {
  if (!courseId) return false;

  const existing = await tx.coursePurchase.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) return false;

  const course = await tx.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  if (!course) return false;

  await tx.coursePurchase.create({
    data: {
      studentId,
      courseId,
      purchasedAt: new Date(),
      isCompleted: false,
      completedLessonsCount: 0,
      progressPercentage: 0,
    },
  });

  return true;
}
