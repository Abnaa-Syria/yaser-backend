import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { createPrivateSessionPayment } from '../financials/student-financial.service.js';

/** Upcoming instructor slots still available for booking (student catalog). */
export const listAvailableSlots = async (limit = 100) => {
  const now = new Date();
  return prisma.instructorAvailability.findMany({
    where: {
      status: 'AVAILABLE',
      startTime: { gte: now },
      price: { gt: 0 },
    },
    take: limit,
    orderBy: { startTime: 'asc' },
    include: {
      instructor: {
        select: { id: true, fullName: true, email: true, avatar: true },
      },
    },
  });
};

/**
 * Initiates a private session booking via direct payment (no package credits).
 */
export const bookPrivateSession = async (
  studentId: string,
  availabilityId: string,
  payment: { paymentMethod: string; receiptUrl: string }
) => {
  if (!payment.paymentMethod?.trim() || !payment.receiptUrl?.trim()) {
    throw new AppError('paymentMethod and receiptUrl are required for booking.', 400);
  }

  return createPrivateSessionPayment(studentId, availabilityId, payment);
};
