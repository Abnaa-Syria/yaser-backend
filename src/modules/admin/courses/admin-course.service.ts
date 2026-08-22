import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { notDeleted, softDeleteData } from '../../../utils/soft-delete.js';
import { logAudit } from '../../../services/audit-logger.service.js';
import { ContentStatus, CourseStaffRole, PublishStatus } from '@prisma/client';
import { platformFeatures } from '../../../config/features.config.js';
import { courseOwnerRoleFilter, getPlatformInstructorId } from '../../../config/platform-instructor.js';

function normalizeIncludes(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    const items = value.map((v) => String(v ?? '').trim()).filter(Boolean);
    return items;
  }
  if (typeof value === 'string') {
    const items = value
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);
    return items;
  }
  return null;
}

/**
 * Create a new course
 */
export const createCourse = async (data: any, actorId?: string) => {
  let instructorId = data.instructorId || undefined;
  if (!instructorId && !platformFeatures.multiInstructor) {
    instructorId = (await getPlatformInstructorId()) || actorId || undefined;
  }

  const isActive = data.isActive !== undefined ? data.isActive : false;
  const includesEn = normalizeIncludes(data.includesEn);
  const includesAr = normalizeIncludes(data.includesAr);

  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      introVideoUrl: data.introVideoUrl,
      categoryId: data.categoryId || undefined,
      instructorId,
      price: data.price ?? 0,
      isLifetimePurchasable: data.isLifetimePurchasable ?? true,
      type: data.type ?? 'RECORDED',
      isActive,
      isFeatured: data.isFeatured === true,
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      useDisplayEnrollmentCount:
        data.useDisplayEnrollmentCount !== undefined ? data.useDisplayEnrollmentCount === true : true,
      displayEnrollmentCount:
        typeof data.displayEnrollmentCount === 'number' ? data.displayEnrollmentCount : 2106,
      publishStatus: isActive ? PublishStatus.PUBLISHED : PublishStatus.DRAFT,
      status: isActive ? ContentStatus.APPROVED : ContentStatus.DRAFT,
      includesEn: includesEn !== undefined ? (includesEn as any) : undefined,
      includesAr: includesAr !== undefined ? (includesAr as any) : undefined,
      targetLevels: data.targetLevels ? (data.targetLevels as any) : null,
      pricingTiers: data.pricingTiers ? {
        create: data.pricingTiers.map((tier: any) => ({
          name: tier.name,
          nameAr: tier.nameAr,
          price: tier.price,
          durationDays: tier.durationDays || null,
          isActive: tier.isActive !== undefined ? tier.isActive : true,
        })),
      } : undefined,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  if (actorId) {
    await logAudit({
      userId: actorId,
      action: 'COURSE_CREATED',
      entityType: 'COURSE',
      entityId: course.id,
      details: { title: course.title },
    });
  }

  return course;
};

/**
 * Update existing course
 */
export const updateCourse = async (id: string, data: any, actorId?: string) => {
  return prisma.$transaction(async (tx) => {
    const includesEn = normalizeIncludes(data.includesEn);
    const includesAr = normalizeIncludes(data.includesAr);
    const publishPatch: { publishStatus?: PublishStatus; status?: ContentStatus } = {};
    if (data.isActive === true) {
      publishPatch.publishStatus = PublishStatus.PUBLISHED;
      publishPatch.status = ContentStatus.APPROVED;
    } else if (data.isActive === false) {
      publishPatch.publishStatus = PublishStatus.DRAFT;
    }

    const course = await tx.course.update({
      where: { id },
      data: {
        title: data.title,
        titleAr: data.titleAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        shortDescription: data.shortDescription,
        shortDescriptionAr: data.shortDescriptionAr,
        thumbnail: data.thumbnail,
        coverImage: data.coverImage !== undefined ? data.coverImage : data.thumbnail,
        introVideoUrl: data.introVideoUrl,
        categoryId: data.categoryId,
        isActive: data.isActive,
        price: data.price,
        isLifetimePurchasable: data.isLifetimePurchasable,
        type: data.type,
        instructorId: data.instructorId,
        isFeatured: data.isFeatured,
        displayOrder: data.displayOrder,
        useDisplayEnrollmentCount: data.useDisplayEnrollmentCount,
        displayEnrollmentCount: data.displayEnrollmentCount,
        targetLevels: data.targetLevels !== undefined ? (data.targetLevels as any) : undefined,
        ...(includesEn !== undefined ? { includesEn: includesEn as any } : {}),
        ...(includesAr !== undefined ? { includesAr: includesAr as any } : {}),
        ...publishPatch,
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        status: true,
      },
    });

    if (data.pricingTiers !== undefined) {
      const incomingTiers = data.pricingTiers || [];
      const existingTiers = await tx.coursePricingTier.findMany({
        where: { courseId: id },
      });

      const incomingIds = incomingTiers.map((t: any) => t.id).filter(Boolean);
      const tiersToDelete = existingTiers.filter((t) => !incomingIds.includes(t.id));

      if (tiersToDelete.length > 0) {
        await tx.coursePricingTier.deleteMany({
          where: { id: { in: tiersToDelete.map((t) => t.id) } },
        });
      }

      for (const tier of incomingTiers) {
        if (tier.id) {
          await tx.coursePricingTier.update({
            where: { id: tier.id },
            data: {
              name: tier.name,
              nameAr: tier.nameAr,
              price: tier.price,
              durationDays: tier.durationDays !== undefined ? tier.durationDays : null,
              isActive: tier.isActive !== undefined ? tier.isActive : true,
            },
          });
        } else {
          await tx.coursePricingTier.create({
            data: {
              courseId: id,
              name: tier.name,
              nameAr: tier.nameAr,
              price: tier.price,
              durationDays: tier.durationDays !== undefined ? tier.durationDays : null,
              isActive: tier.isActive !== undefined ? tier.isActive : true,
            },
          });
        }
      }
    }

    if (actorId) {
      await logAudit({
        userId: actorId,
        action: 'COURSE_UPDATED',
        entityType: 'COURSE',
        entityId: id,
        details: data,
      });
    }

    return course;
  });
};

/**
 * Delete course
 */
export const deleteCourse = async (id: string, actorId?: string) => {
  await prisma.course.update({ where: { id }, data: softDeleteData() });
  if (actorId) {
    await logAudit({
      userId: actorId,
      action: 'COURSE_SOFT_DELETED',
      entityType: 'COURSE',
      entityId: id,
    });
  }
  return { id, deleted: true };
};

/**
 * Assign an instructor to a course
 */
export const assignInstructor = async (courseId: string, instructorId: string) => {
  // Check if instructor exists and has correct role
  const instructor = await prisma.user.findFirst({
    where: { id: instructorId, ...courseOwnerRoleFilter() },
  });

  if (!instructor) throw new AppError('Target user is not a valid instructor.', 400);

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: { instructorId },
    select: {
      id: true,
      title: true,
      instructor: {
        select: { fullName: true },
      },
    },
  });

  return updatedCourse;
};

/**
 * Get all courses with filtering and pagination
 */
export const getAllCourses = async (options: {
  page: number;
  limit: number;
  categoryId?: string;
  instructorId?: string;
  status?: string;
  search?: string;
}) => {
  const { page, limit, categoryId, instructorId, status, search } = options;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where: any = notDeleted();

  if (categoryId) where.categoryId = categoryId;
  if (instructorId) where.instructorId = instructorId;
  if (status) {
    if (status === 'active') where.isActive = true;
    else if (['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status as ContentStatus;
    }
  }
  if (search) {
    where.title = { contains: search };
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: skip,
      take: limitNum,
      include: {
        category: { select: { id: true, name: true } },
        instructor: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.course.count({ where })
  ]);


  return {
    courses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get detailed course info
 */
export const getCourseById = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: notDeleted({ id }),
    include: {
      category: true,
      pricingTiers: true,
      instructor: {
        select: { id: true, fullName: true, email: true, avatar: true },
      },
      units: {
        orderBy: { order: 'asc' },
        include: {
          sections: {
            where: notDeleted(),
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                where: notDeleted(),
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
      exams: {
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    }
  });

  if (!course) throw new AppError('Course not found', 404);

  return course;
};

export const submitCourseForReview = async (courseId: string, actorId: string) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: { status: ContentStatus.PENDING_REVIEW },
    select: { id: true, title: true, status: true },
  });
  await logAudit({
    userId: actorId,
    action: 'COURSE_SUBMITTED_FOR_REVIEW',
    entityType: 'COURSE',
    entityId: courseId,
  });
  return course;
};

export const approveCourse = async (
  courseId: string,
  reviewerId: string,
  reviewNotes?: string
) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      status: ContentStatus.APPROVED,
      publishStatus: PublishStatus.PUBLISHED,
      isActive: true,
      reviewedById: reviewerId,
      reviewNotes: reviewNotes ?? null,
      rejectionReason: null,
    },
    select: { id: true, title: true, status: true, publishStatus: true },
  });
  await logAudit({
    userId: reviewerId,
    action: 'COURSE_APPROVED',
    entityType: 'COURSE',
    entityId: courseId,
    details: { reviewNotes },
  });
  return course;
};

export const rejectCourse = async (
  courseId: string,
  reviewerId: string,
  rejectionReason: string,
  reviewNotes?: string
) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      status: ContentStatus.REJECTED,
      publishStatus: PublishStatus.DRAFT,
      isActive: false,
      reviewedById: reviewerId,
      rejectionReason,
      reviewNotes: reviewNotes ?? null,
    },
    select: { id: true, title: true, status: true, rejectionReason: true },
  });
  await logAudit({
    userId: reviewerId,
    action: 'COURSE_REJECTED',
    entityType: 'COURSE',
    entityId: courseId,
    details: { rejectionReason, reviewNotes },
  });
  return course;
};

export const getReviewQueue = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const where = notDeleted({ status: ContentStatus.PENDING_REVIEW });
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        instructor: { select: { id: true, fullName: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);
  return { courses, total, page, limit };
};

export const listCourseStaff = async (courseId: string) => {
  return prisma.courseStaff.findMany({
    where: { courseId },
    include: {
      user: { select: { id: true, fullName: true, email: true, avatar: true } },
    },
  });
};

export const addCourseStaff = async (
  courseId: string,
  userId: string,
  role: CourseStaffRole,
  actorId: string
) => {
  const staff = await prisma.courseStaff.create({
    data: { courseId, userId, role },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
  await logAudit({
    userId: actorId,
    action: 'COURSE_STAFF_ASSIGNED',
    entityType: 'COURSE',
    entityId: courseId,
    details: { userId, role },
  });
  return staff;
};

export const removeCourseStaff = async (
  courseId: string,
  staffId: string,
  actorId: string
) => {
  await prisma.courseStaff.delete({ where: { id: staffId, courseId } });
  await logAudit({
    userId: actorId,
    action: 'COURSE_STAFF_REMOVED',
    entityType: 'COURSE',
    entityId: courseId,
    details: { staffId },
  });
  return { id: staffId, removed: true };
};

