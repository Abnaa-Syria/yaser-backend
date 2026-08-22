import { prisma } from '../../../prisma.js';
import { detailRows, notifyAdmins } from '../../notifications/admin-alert.service.js';

export const createContactSubmission = async (data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) => {
  const submission = await prisma.contactSubmission.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: (data.subject || '').trim(),
      message: data.message.trim(),
    },
  });

  void notifyAdmins({
    title: 'New contact message',
    message: `${submission.name} sent a contact form message.`,
    emailSubject: submission.subject
      ? `Contact: ${submission.subject}`
      : 'New contact form message',
    emailDetailsHtml: detailRows([
      ['Name', submission.name],
      ['Email', submission.email],
      ['Subject', submission.subject],
      ['Message', submission.message],
    ]),
    ctaPath: '/admin/tickets',
    ctaLabel: 'Open admin',
    entityId: submission.id,
    entityType: 'ContactSubmission',
  });

  return submission;
};
