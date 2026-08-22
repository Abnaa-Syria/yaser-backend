import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '../prisma.js';
import { MAIL_CONFIG, isSmtpConfigured } from '../config/mail.config.js';
import { APP_BRAND } from '../config/brand.config.js';
import { wrapEmailHtml } from './email-layout.js';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!MAIL_CONFIG.enabled || !isSmtpConfigured()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: MAIL_CONFIG.host,
      port: MAIL_CONFIG.port,
      secure: MAIL_CONFIG.secure,
      auth: {
        user: MAIL_CONFIG.user,
        pass: MAIL_CONFIG.pass,
      },
    });
  }
  return transporter;
};

export const renderTemplate = (
  template: string,
  vars: Record<string, string | number | undefined | null>
): string => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
};

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Skip branded layout wrapper (rare). */
  rawHtml?: boolean;
};

export type SendMailResult = {
  sent: boolean;
  skipped: boolean;
  messageId?: string;
  reason?: string;
};

export const sendMail = async (input: SendMailInput): Promise<SendMailResult> => {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[mail] SMTP not configured — skipping send', {
        to: input.to,
        subject: input.subject,
      });
    }
    return {
      sent: false,
      skipped: true,
      reason: 'SMTP not configured',
    };
  }

  const html = input.rawHtml ? input.html : wrapEmailHtml(input.html, { preheader: input.subject });

  try {
    const info = await transport.sendMail({
      from: `"${APP_BRAND.name}" <${MAIL_CONFIG.from}>`,
      to: input.to,
      subject: input.subject,
      html,
      text: input.text,
    });

    return {
      sent: true,
      skipped: false,
      messageId: info.messageId,
    };
  } catch (err) {
    transporter = null;
    const reason = err instanceof Error ? err.message : 'SMTP send failed';
    console.error('[mail] send failed:', reason);
    return {
      sent: false,
      skipped: false,
      reason,
    };
  }
};

export const sendTemplatedEmail = async (input: {
  to: string;
  templateName: string;
  vars?: Record<string, string | number | undefined | null>;
  fallbackSubject?: string;
  fallbackHtml?: string;
}): Promise<SendMailResult> => {
  const vars = {
    app_name: APP_BRAND.name,
    site_url: APP_BRAND.siteUrl,
    contact_email: APP_BRAND.contactEmail,
    ...(input.vars || {}),
  };

  const template = await prisma.emailTemplate.findUnique({
    where: { name: input.templateName },
  });

  const subject = template
    ? renderTemplate(template.subject, vars)
    : input.fallbackSubject || APP_BRAND.name;
  const html = template
    ? renderTemplate(template.body, vars)
    : input.fallbackHtml || `<p>${APP_BRAND.name}</p>`;

  return sendMail({ to: input.to, subject, html });
};

export const previewTemplate = (
  subject: string,
  body: string,
  vars: Record<string, string | number | undefined | null> = {}
) => {
  const merged = {
    app_name: APP_BRAND.name,
    site_url: APP_BRAND.siteUrl,
    contact_email: APP_BRAND.contactEmail,
    student_name: 'Demo Student',
    course_title: 'USMLE Step 1 Prep',
    reset_link: `${APP_BRAND.siteUrl}/reset-password/demo-token`,
    otp_code: '123456',
    ...vars,
  };
  const renderedSubject = renderTemplate(subject, merged);
  const renderedBody = renderTemplate(body, merged);
  return {
    subject: renderedSubject,
    html: wrapEmailHtml(renderedBody, { preheader: renderedSubject }),
  };
};

/** Send the same message to many recipients (sequential to respect SMTP limits). */
export const sendMailToMany = async (input: {
  recipients: Array<{ email: string; name?: string | null }>;
  subject: string;
  html: string;
}): Promise<{ sent: number; failed: number; skipped: number }> => {
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const recipient of input.recipients) {
    if (!recipient.email) {
      skipped += 1;
      continue;
    }
    const result = await sendMail({
      to: recipient.email,
      subject: input.subject,
      html: input.html,
    });
    if (result.sent) sent += 1;
    else if (result.skipped) skipped += 1;
    else failed += 1;
  }
  return { sent, failed, skipped };
};
