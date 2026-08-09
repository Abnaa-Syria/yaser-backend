import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';

function computeEndDate(startDate: Date, durationMonths: number): Date {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + durationMonths);
  return end;
}

export const getAllSubscriptions = async () => {
  return prisma.userSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, fullName: true, email: true } },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
        },
      },
    },
  });
};

export const updateSubscriptionStatus = async (id: string, status: any) => {
  return prisma.userSubscription.update({
    where: { id },
    data: { status },
    include: {
      student: { select: { id: true, fullName: true, email: true } },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
        },
      },
    },
  });
};

export const createSubscription = async (body: any) => {
  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const planId = body.planId || body.packageId;
  const studentId = body.studentId || body.userId;
  if (!planId) throw new AppError('planId (or packageId) is required.', 400);
  if (!studentId) throw new AppError('studentId is required.', 400);

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError('Subscription plan not found.', 404);

  const endDate = body.endDate ? new Date(body.endDate) : computeEndDate(startDate, plan.durationMonths);

  return prisma.userSubscription.create({
    data: {
      studentId,
      planId,
      startDate,
      endDate,
      status: body.status || 'ACTIVE',
    },
    include: {
      student: { select: { id: true, fullName: true, email: true } },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
        },
      },
    },
  });
};

export const getAllEnrollments = async () => {
  const purchases = await prisma.coursePurchase.findMany({
    orderBy: { purchasedAt: 'desc' },
    include: {
      student: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });
  return purchases.map((purchase) => ({
    ...purchase,
    courseId: purchase.course.id,
    enrolledAt: purchase.purchasedAt,
  }));
};

export const createEnrollment = async (body: any) => {
  if (!body.studentId || !body.courseId) {
    throw new AppError('studentId and courseId are required', 400);
  }

  const existing = await prisma.coursePurchase.findUnique({
    where: { studentId_courseId: { studentId: body.studentId, courseId: body.courseId } },
  });
  if (existing) throw new AppError('Student already owns this course.', 400);

  return prisma.coursePurchase.create({
    data: {
      studentId: body.studentId,
      courseId: body.courseId,
    },
  });
};

export const getLookups = async () => {
  const [students, packages, courses] = await Promise.all([
    prisma.user.findMany({
      where: userHasRoleName('STUDENT'),
      select: { id: true, fullName: true, email: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: { id: true, name: true, durationMonths: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
  ]);

  return { students, packages, courses };
};
