import { NotificationType } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { userHasRoleNameIn } from '../../utils/role-query.js';
import { sendMail } from '../../utils/mail.js';
import { emailButton, emailHeading, emailParagraph, escapeHtml } from '../../utils/email-layout.js';
import { APP_BRAND } from '../../config/brand.config.js';
import { createNotification } from './notification.service.js';

export type AdminAlertInput = {
  title: string;
  message: string;
  emailSubject?: string;
  /** Extra HTML blocks inserted into the branded email body (already escaped or safe). */
  emailDetailsHtml?: string;
  ctaPath?: string;
  ctaLabel?: string;
  type?: NotificationType;
  entityId?: string;
  entityType?: string;
};

export async function listAdminUsers() {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...userHasRoleNameIn(['ADMIN', 'SUPER_ADMIN']),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  });
}

/**
 * In-app notification + email for every active admin/super-admin.
 * Fire-and-forget safe: callers should `void notifyAdmins(...)`.
 */
export async function notifyAdmins(input: AdminAlertInput) {
  const admins = await listAdminUsers();
  if (!admins.length) return { notified: 0 };

  const type = input.type || 'GENERAL';
  const subject = input.emailSubject || input.title;
  const ctaUrl = input.ctaPath
    ? `${APP_BRAND.siteUrl.replace(/\/$/, '')}${input.ctaPath.startsWith('/') ? '' : '/'}${input.ctaPath}`
    : `${APP_BRAND.siteUrl}/admin`;

  const html = [
    emailHeading(input.title),
    emailParagraph(input.message),
    input.emailDetailsHtml || '',
    emailButton(ctaUrl, input.ctaLabel || 'Open admin panel'),
  ].join('\n');

  await Promise.all(
    admins.map(async (admin) => {
      try {
        await createNotification(admin.id, input.title, input.message, type, undefined, {
          entityId: input.entityId,
          entityType: input.entityType,
        });
      } catch (err) {
        console.error('[notifyAdmins] notification failed', admin.id, err);
      }
      if (admin.email) {
        try {
          await sendMail({
            to: admin.email,
            subject: `[${APP_BRAND.name}] ${subject}`,
            html,
          });
        } catch (err) {
          console.error('[notifyAdmins] email failed', admin.email, err);
        }
      }
    })
  );

  return { notified: admins.length };
}

export function detailRows(rows: Array<[string, string | number | null | undefined]>): string {
  const cells = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 0;color:#64748B;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#0F172A;font-size:13px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');
  if (!cells) return '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 18px;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;">${cells}</table>`;
}
