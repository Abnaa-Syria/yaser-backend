import { prisma } from '../../../prisma.js';
import { detailRows, notifyAdmins } from '../../notifications/admin-alert.service.js';

type InstructorApplicationInput = {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  experience?: string;
  message: string;
  documentUrl?: string;
};

export async function submitInstructorApplication(data: InstructorApplicationInput) {
  const application = await prisma.instructorApplication.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      specialty: data.specialty?.trim() || null,
      experience: data.experience?.trim() || null,
      message: data.message.trim(),
      documentUrl: data.documentUrl?.trim() || null,
      status: 'NEW',
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      name: true,
      email: true,
      phone: true,
      specialty: true,
    },
  });

  void notifyAdmins({
    title: 'New instructor application',
    message: `${application.name} applied to become an instructor.`,
    emailSubject: 'New instructor application',
    emailDetailsHtml: detailRows([
      ['Name', application.name],
      ['Email', application.email],
      ['Phone', application.phone],
      ['Specialty', application.specialty],
    ]),
    ctaPath: '/admin/instructors',
    ctaLabel: 'Review applications',
    entityId: application.id,
    entityType: 'InstructorApplication',
  });

  return {
    id: application.id,
    status: application.status,
    createdAt: application.createdAt,
  };
}
