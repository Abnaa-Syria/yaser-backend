import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { courseOwnerRoleFilter, getPlatformInstructorId } from '../../../config/platform-instructor.js';
import { platformFeatures } from '../../../config/features.config.js';
import { notDeleted } from '../../../utils/soft-delete.js';

export const getAllInstructors = async (query: any) => {
  const { page = '1', limit = '10', search } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    ...courseOwnerRoleFilter(),
    isActive: true,
  };
  if (!platformFeatures.multiInstructor) {
    where.AND = [
      {
        OR: [
          { coursesInstructed: { some: {} } },
          { availabilities: { some: { status: 'AVAILABLE', startTime: { gte: new Date() } } } },
        ],
      },
    ];
  }
  if (search) {
    where.OR = [{ fullName: { contains: search } }, { bio: { contains: search } }];
  }

  const [instructors, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { averageRating: 'desc' },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        bio: true,
        experience: true,
        averageRating: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    instructors,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getPublicInstructors = getAllInstructors;

export const getPlatformOwnerPublicProfile = async () => {
  const id = await getPlatformInstructorId();
  if (!id) throw new AppError('Platform instructor is not configured.', 404);
  return getInstructorById(id);
};

/**
 * Get instructor profile by ID.
 * Accepts the course owner even when they are SUPER_ADMIN (single-instructor platform).
 */
export const getInstructorById = async (id: string) => {
  const instructor = await prisma.user.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
      OR: [
        courseOwnerRoleFilter(),
        { coursesInstructed: { some: {} } },
        { availabilities: { some: {} } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      bio: true,
      experience: true,
      averageRating: true,
      receivedReviews: {
        where: { isVisible: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { fullName: true, avatar: true } },
        },
      },
    },
  });

  if (!instructor) throw new AppError('Instructor not found.', 404);
  return instructor;
};

/** Alias for controller compatibility — supports `platform-owner` shortcut. */
export const getPublicInstructorProfile = async (id: string) => {
  if (id === 'platform-owner') return getPlatformOwnerPublicProfile();
  return getInstructorById(id);
};

/**
 * Get courses taught by an instructor
 */
export const getInstructorCourses = async (id: string) => {
  const instructorId = id === 'platform-owner' ? await getPlatformInstructorId() : id;
  if (!instructorId) throw new AppError('Instructor not found.', 404);
  return prisma.course.findMany({
    where: {
      ...notDeleted(),
      isActive: true,
      instructorId,
    },
    select: {
      id: true,
      title: true,
      titleAr: true,
      description: true,
      thumbnail: true,
      type: true,
      price: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
};

/**
 * Get reviews for an instructor
 */
export const getInstructorReviews = async (id: string) => {
  const instructorId = id === 'platform-owner' ? await getPlatformInstructorId() : id;
  if (!instructorId) throw new AppError('Instructor not found.', 404);
  return prisma.instructorReview.findMany({
    where: { instructorId, isVisible: true },
    include: {
      student: { select: { fullName: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/** Upcoming bookable slots for a specific instructor (public catalog). */
export const getInstructorAvailableSlots = async (id: string, limit = 24) => {
  const instructor = await prisma.user.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
      OR: [
        courseOwnerRoleFilter(),
        { coursesInstructed: { some: {} } },
        { availabilities: { some: {} } },
      ],
    },
    select: { id: true },
  });
  if (!instructor) throw new AppError('Instructor not found.', 404);

  const now = new Date();
  return prisma.instructorAvailability.findMany({
    where: {
      instructorId: id,
      status: 'AVAILABLE',
      startTime: { gte: now },
      price: { gt: 0 },
    },
    take: Math.min(Math.max(limit, 1), 50),
    orderBy: { startTime: 'asc' },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      price: true,
    },
  });
};
