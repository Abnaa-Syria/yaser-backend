import { prisma } from '../../prisma.js';
import { getInstructorPerformanceDashboard } from '../instructor/performance/instructor-performance.service.js';

/**
 * Get instructor dashboard stats
 */
export const getDashboardStats = async (instructorId: string) => {
  const [totalCourses, user] = await prisma.$transaction([
    prisma.course.count({
      where: { instructorId },
    }),
    prisma.user.findUnique({
      where: { id: instructorId },
      select: { averageRating: true },
    }),
  ]);

  return {
    totalCourses,
    upcomingSessions: 0,
    averageRating: user?.averageRating || 0,
  };
};

/**
 * Get instructor courses with filtering
 */
export const getInstructorClasses = async (instructorId: string, query: any) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where: { instructorId, deletedAt: null },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        isActive: true,
        thumbnail: true,
        _count: { select: { purchases: true } },
      },
    }),
    prisma.course.count({ where: { instructorId, deletedAt: null } }),
  ]);

  const classes = courses.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    isActive: c.isActive,
    thumbnail: c.thumbnail,
    enrollmentCount: c._count.purchases,
    upcomingSessions: 0,
  }));

  return {
    classes,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getPerformanceMetrics = getInstructorPerformanceDashboard;
