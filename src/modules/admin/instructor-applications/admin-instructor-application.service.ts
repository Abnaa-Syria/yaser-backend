import type { InstructorApplicationStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

export async function listInstructorApplications(query: { status?: InstructorApplicationStatus }) {
  return prisma.instructorApplication.findMany({
    where: query.status ? { status: query.status } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInstructorApplication(id: string) {
  const application = await prisma.instructorApplication.findUnique({ where: { id } });
  if (!application) throw new AppError('Instructor application not found.', 404);
  return application;
}

export async function updateInstructorApplication(
  id: string,
  reviewerId: string | undefined,
  data: { status?: InstructorApplicationStatus; adminNotes?: string }
) {
  await getInstructorApplication(id);
  return prisma.instructorApplication.update({
    where: { id },
    data: {
      status: data.status,
      adminNotes: data.adminNotes?.trim(),
      reviewedById: reviewerId || null,
      reviewedAt: new Date(),
    },
  });
}
