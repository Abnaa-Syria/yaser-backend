import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';

function getCourseRecommendationCta(course: { id: string; price: number; isLifetimePurchasable: boolean }) {
  if (course.isLifetimePurchasable) {
    return {
      label: 'Buy Directly',
      action: 'BUY_DIRECTLY',
      courseId: course.id,
      reason: 'Available for direct purchase',
    };
  }

  return {
    label: 'Unavailable',
    action: 'UNAVAILABLE',
    courseId: course.id,
    reason: 'This course is not currently available for purchase',
  };
}

function shapeRecommendation(
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    introVideoUrl: string | null;
    type: string;
    price: number;
    isLifetimePurchasable: boolean;
    category: { id: string; name: string; slug: string } | null;
    instructor: { id: string; fullName: string; avatar: string | null; bio: string | null } | null;
    _count: { purchases: number };
  },
  options: { isEnrolled: boolean; strategy: string; progressPercentage?: number }
) {
  const cta = options.isEnrolled
    ? {
        label: 'Continue Learning',
        action: 'CONTINUE',
        courseId: course.id,
        reason:
          options.progressPercentage && options.progressPercentage > 0
            ? 'Continue where you left off'
            : 'You already own this course',
      }
    : getCourseRecommendationCta(course);

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    introVideoUrl: course.introVideoUrl,
    type: course.type,
    price: course.price,
    category: course.category,
    instructor: course.instructor,
    recommendedReason: cta.reason,
    recommendationStrategy: options.strategy,
    cta: {
      label: cta.label,
      action: cta.action,
      courseId: cta.courseId,
    },
    isEnrolled: options.isEnrolled,
    progressPercentage: options.progressPercentage ?? null,
    purchaseCount: course._count.purchases,
    _count: course._count,
  };
}

const courseCatalogSelect = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  introVideoUrl: true,
  type: true,
  price: true,
  isLifetimePurchasable: true,
  category: { select: { id: true, name: true, slug: true } },
  instructor: {
    select: { id: true, fullName: true, avatar: true, bio: true },
  },
  _count: { select: { purchases: true } },
} as const;

/**
 * List all courses the student has purchased
 */
export const getMyCourses = async (studentId: string) => {
  const purchases = await prisma.coursePurchase.findMany({
    where: { studentId },
    select: {
      purchasedAt: true,
      accessStartsAt: true,
      activatedAt: true,
      expiresAt: true,
      pricingTierId: true,
      paymentId: true,
      progressPercentage: true,
      completedLessonsCount: true,
      isCompleted: true,
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          type: true,
          instructor: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { purchasedAt: 'desc' },
  });

  return purchases.map((p) => ({
    ...p.course,
    progressPercentage: p.progressPercentage,
    completedLessonsCount: p.completedLessonsCount,
    isCompleted: p.isCompleted,
    purchasedAt: p.purchasedAt,
    accessStartsAt: p.accessStartsAt,
    activatedAt: p.activatedAt,
    expiresAt: p.expiresAt,
    pricingTierId: p.pricingTierId,
    paymentId: p.paymentId,
    accessStatus:
      p.expiresAt && p.expiresAt.getTime() <= Date.now()
        ? 'EXPIRED'
        : p.accessStartsAt && p.accessStartsAt.getTime() > Date.now()
          ? 'UPCOMING'
          : 'ACTIVE',
  }));
};

async function fetchPurchasableCourses(excludeCourseIds: Set<string>, take: number) {
  return prisma.course.findMany({
    where: {
      isActive: true,
      isLifetimePurchasable: true,
      ...(excludeCourseIds.size ? { id: { notIn: [...excludeCourseIds] } } : {}),
    },
    take,
    orderBy: { createdAt: 'desc' },
    select: courseCatalogSelect,
  });
}

async function fetchContinueLearningCourses(studentId: string, take: number) {
  const purchases = await prisma.coursePurchase.findMany({
    where: { studentId, isCompleted: false },
    orderBy: [{ progressPercentage: 'asc' }, { purchasedAt: 'desc' }],
    take,
    select: {
      progressPercentage: true,
      course: { select: courseCatalogSelect },
    },
  });

  const seen = new Set<string>();
  return purchases
    .map((row) => ({
      course: row.course,
      progressPercentage: row.progressPercentage,
    }))
    .filter((row) => {
      if (seen.has(row.course.id)) return false;
      seen.add(row.course.id);
      return true;
    });
}

async function fetchPopularActiveCourses(take: number) {
  const courses = await prisma.course.findMany({
    where: { isActive: true, isLifetimePurchasable: true },
    take: Math.max(take * 3, take),
    orderBy: { createdAt: 'desc' },
    select: courseCatalogSelect,
  });

  return [...courses].sort((a, b) => b._count.purchases - a._count.purchases);
}

/**
 * Recommended courses for the student home screen.
 */
export const getRecommendedCourses = async (studentId: string, options: { limit?: number } = {}) => {
  const limit = options.limit ?? 10;

  const purchases = await prisma.coursePurchase.findMany({
    where: { studentId },
    select: { courseId: true, progressPercentage: true },
  });

  const ownedCourseIds = new Set(purchases.map((p) => p.courseId));
  const progressByCourseId = new Map(purchases.map((p) => [p.courseId, p.progressPercentage]));

  let strategy = 'NEW_PURCHASABLE';
  let recommendations: ReturnType<typeof shapeRecommendation>[] = [];

  const newCourses = await fetchPurchasableCourses(ownedCourseIds, Math.max(limit * 3, limit));

  recommendations = newCourses
    .map((course) =>
      shapeRecommendation(course, {
        isEnrolled: false,
        strategy,
      })
    )
    .sort((a, b) => (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0))
    .slice(0, limit);

  if (recommendations.length < limit) {
    strategy = 'CONTINUE_LEARNING';
    const continueRows = await fetchContinueLearningCourses(studentId, limit);
    const existingIds = new Set(recommendations.map((item) => item.id));

    for (const row of continueRows) {
      if (recommendations.length >= limit || existingIds.has(row.course.id)) continue;
      recommendations.push(
        shapeRecommendation(row.course, {
          isEnrolled: true,
          strategy,
          progressPercentage: row.progressPercentage,
        })
      );
      existingIds.add(row.course.id);
    }
  }

  if (recommendations.length < limit) {
    strategy = recommendations.length > 0 ? 'MIXED' : 'POPULAR_ACTIVE';
    const popularCourses = await fetchPopularActiveCourses(limit);
    const existingIds = new Set(recommendations.map((item) => item.id));

    for (const course of popularCourses) {
      if (recommendations.length >= limit || existingIds.has(course.id)) continue;

      recommendations.push(
        shapeRecommendation(course, {
          isEnrolled: ownedCourseIds.has(course.id),
          strategy,
          progressPercentage: progressByCourseId.get(course.id),
        })
      );
      existingIds.add(course.id);
    }
  }

  return {
    recommendations: recommendations.slice(0, limit),
    meta: {
      limit,
      total: recommendations.length,
      strategy,
      excludedOwnedCourses: ownedCourseIds.size,
    },
  };
};

/**
 * Get units and lessons for a purchased course
 */
export const getCourseContent = async (studentId: string, courseId: string) => {
  await requireCourseAccess(studentId, courseId);

  return prisma.unit.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      order: true,
      sections: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              content: true,
              order: true,
              videoUrl: true,
              vdoCipherVideoId: true,
              isPreview: true,
              resources: {
                where: { isVisible: true },
                orderBy: { createdAt: 'asc' },
                select: {
                  id: true,
                  title: true,
                  fileUrl: true,
                  externalUrl: true,
                  fileType: true,
                  mimeType: true,
                  fileSizeBytes: true,
                  isDownloadable: true,
                },
              },
              exams: {
                where: { status: { in: ['AVAILABLE', 'UPCOMING'] } },
                select: { id: true, title: true, status: true, durationMinutes: true },
              },
              flashcards: {
                where: { status: 'PUBLISHED' },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });
};

/**
 * Get exams for a purchased course
 */
export const getCourseExams = async (studentId: string, courseId: string) => {
  await requireCourseAccess(studentId, courseId);

  return prisma.exam.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      scheduledAt: true,
      durationMinutes: true,
      totalPoints: true,
      passingScore: true,
      course: { select: { id: true, title: true } },
      unit: { select: { id: true, title: true } },
      lesson: { select: { id: true, title: true } },
    },
  });
};
