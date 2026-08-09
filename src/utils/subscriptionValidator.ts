import { prisma } from '../prisma.js';
import { AppError } from './AppError.js';

/** Lifetime purchase grants permanent access to a single course. */
export const hasLifetimePurchase = async (
  studentId: string,
  courseId: string
): Promise<boolean> => {
  const purchase = await prisma.coursePurchase.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!purchase) return false;

  if (purchase.expiresAt && purchase.expiresAt < new Date()) {
    return false;
  }

  return true;
};

export const hasCourseAccess = async (studentId: string, courseId: string): Promise<boolean> => {
  return hasLifetimePurchase(studentId, courseId);
};

export const requireCourseAccess = async (studentId: string, courseId: string) => {
  const allowed = await hasCourseAccess(studentId, courseId);
  if (!allowed) {
    throw new AppError('Access denied. Purchase this course for lifetime access.', 403);
  }
};

/** @deprecated Packages are disabled — use course purchase instead. */
export const hasActiveSubscription = async (_studentId: string): Promise<boolean> => false;

/** @deprecated Packages are disabled. */
export const consumePackageCredit = async (_studentId: string, _feature?: string) => {
  throw new AppError('Platform subscriptions are not available. Please purchase the course directly.', 403);
};

export const validateSubscriptionLimits = consumePackageCredit;
