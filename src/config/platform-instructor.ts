import { prisma } from '../prisma.js';
import { platformFeatures } from './features.config.js';
import { userHasRoleName, userHasRoleNameIn } from '../utils/role-query.js';

/**
 * Resolve the platform's primary instructor (course owner).
 * Single-instructor product: the platform owner teaches all courses.
 */
export async function getPlatformInstructorId(): Promise<string | null> {
  if (!platformFeatures.multiInstructor) {
    const ownerWithCourses = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          userHasRoleName('SUPER_ADMIN'),
          userHasRoleName('INSTRUCTOR'),
        ],
        coursesInstructed: { some: {} },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (ownerWithCourses) return ownerWithCourses.id;

    const owner = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        ...userHasRoleName('SUPER_ADMIN'),
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (owner) return owner.id;
  }

  const instructor = await prisma.user.findFirst({
    where: { deletedAt: null, isActive: true, ...userHasRoleName('INSTRUCTOR') },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return instructor?.id ?? null;
}

/** Roles that may own/teach courses. Always includes SUPER_ADMIN for owner-instructor platforms. */
export function courseOwnerRoleFilter() {
  if (platformFeatures.multiInstructor) {
    return userHasRoleNameIn(['INSTRUCTOR', 'SUPER_ADMIN', 'ADMIN']);
  }
  return userHasRoleNameIn(['SUPER_ADMIN', 'INSTRUCTOR', 'ADMIN']);
}
