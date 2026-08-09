import { prisma } from '../../../prisma.js';

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
  return prisma.instructorApplication.create({
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
    },
  });
}
