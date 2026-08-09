import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { courseOwnerRoleFilter, getPlatformInstructorId } from '../../../config/platform-instructor.js';

export const createPrivateSessionRequest = async (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredTime?: string;
  instructorId?: string;
  studentId?: string;
}) => {
  let instructorId = data.instructorId?.trim() || null;

  if (instructorId === 'platform-owner' || !instructorId) {
    instructorId = await getPlatformInstructorId();
  }

  if (instructorId) {
    const instructor = await prisma.user.findFirst({
      where: {
        id: instructorId,
        isActive: true,
        deletedAt: null,
        OR: [
          courseOwnerRoleFilter(),
          { coursesInstructed: { some: {} } },
        ],
      },
      select: { id: true },
    });
    if (!instructor) throw new AppError('Instructor not found.', 404);
    instructorId = instructor.id;
  }

  return prisma.privateSessionRequest.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      message: data.message.trim(),
      preferredTime: data.preferredTime?.trim() || null,
      instructorId,
      studentId: data.studentId || null,
    },
  });
};
