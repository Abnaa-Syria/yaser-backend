import { prisma } from '../../../prisma.js';

export const createContactSubmission = async (data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) => {
  return prisma.contactSubmission.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: (data.subject || '').trim(),
      message: data.message.trim(),
    },
  });
};
