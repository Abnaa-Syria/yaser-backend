import type { Prisma } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { previewTemplate, sendMail, sendMailToMany } from '../../../utils/mail.js';
import { clearMaintenanceModeCache } from '../../../services/maintenance.service.js';
import { userHasRoleName } from '../../../utils/role-query.js';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object') {
    return value as Prisma.InputJsonValue;
  }
  return String(value);
}

// --- Global Settings ---
export const getAllSettings = async () => {
  return await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
};

export const updateSettings = async (settings: Record<string, unknown>) => {
  const entries = Object.entries(settings).filter(([key]) => key?.length > 0);
  if (entries.length === 0) {
    throw new AppError('No settings provided', 400);
  }

  const updates = entries.map(([key, value]) =>
    prisma.platformSetting.upsert({
      where: { key },
      update: { value: toJsonValue(value) },
      create: { key, value: toJsonValue(value) },
    })
  );

  const result = await prisma.$transaction(updates);
  if (Object.prototype.hasOwnProperty.call(settings, 'MAINTENANCE_MODE')) {
    clearMaintenanceModeCache();
  }
  return result;
};


// --- Email Templates ---
export const getAllEmailTemplates = async () => {
  return await prisma.emailTemplate.findMany();
};




export const createEmailTemplate = async (data: any) => {
  return await prisma.emailTemplate.create({ data });
};




export const updateEmailTemplate = async (id: string, data: any) => {
  return await prisma.emailTemplate.update({
    where: { id },
    data
  });
};




export const deleteEmailTemplate = async (id: string) => {
  return await prisma.emailTemplate.delete({ where: { id } });
};

export const previewEmailTemplate = async (input: {
  id?: string;
  subject?: string;
  body?: string;
  vars?: Record<string, string>;
}) => {
  let subject = input.subject;
  let body = input.body;

  if (input.id) {
    const template = await prisma.emailTemplate.findUnique({ where: { id: input.id } });
    if (!template) throw new AppError('Email template not found', 404);
    subject = subject || template.subject;
    body = body || template.body;
  }

  if (!subject || !body) {
    throw new AppError('Subject and body are required for preview', 400);
  }

  return previewTemplate(subject, body, input.vars);
};

export const sendTestEmailTemplate = async (input: {
  id?: string;
  to: string;
  subject?: string;
  body?: string;
  vars?: Record<string, string>;
}) => {
  const preview = await previewEmailTemplate(input);
  const result = await sendMail({
    to: input.to,
    subject: `[TEST] ${preview.subject}`,
    html: preview.html,
  });

  if (!result.sent && result.skipped) {
    throw new AppError(
      'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send email.',
      503
    );
  }

  return { ...result, preview };
};

export const sendBroadcastEmail = async (input: {
  mode: 'all_students' | 'selected';
  studentIds?: string[];
  subject: string;
  body: string;
}) => {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || !body) {
    throw new AppError('Subject and body are required', 400);
  }

  let recipients: Array<{ email: string; name?: string | null }> = [];

  if (input.mode === 'all_students') {
    const students = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...userHasRoleName('STUDENT'),
        email: { not: '' },
      },
      select: { email: true, fullName: true },
    });
    recipients = students.map((s) => ({ email: s.email, name: s.fullName }));
  } else {
    const ids = [...new Set((input.studentIds || []).filter(Boolean))];
    if (!ids.length) {
      throw new AppError('Select at least one student', 400);
    }
    const students = await prisma.user.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        ...userHasRoleName('STUDENT'),
      },
      select: { email: true, fullName: true },
    });
    recipients = students.map((s) => ({ email: s.email, name: s.fullName }));
  }

  if (!recipients.length) {
    throw new AppError('No student recipients found', 404);
  }

  const result = await sendMailToMany({
    recipients,
    subject,
    html: body,
  });

  if (result.sent === 0 && result.skipped > 0 && result.failed === 0) {
    throw new AppError(
      'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send email.',
      503
    );
  }

  return {
    ...result,
    recipientCount: recipients.length,
  };
};

