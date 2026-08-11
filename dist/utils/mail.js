import nodemailer from 'nodemailer';
import { prisma } from '../prisma.js';
import { MAIL_CONFIG, isSmtpConfigured } from '../config/mail.config.js';
import { APP_BRAND } from '../config/brand.config.js';
let transporter = null;
const getTransporter = () => {
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
export const renderTemplate = (template, vars) => {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        const value = vars[key];
        return value === undefined || value === null ? '' : String(value);
    });
};
export const sendMail = async (input) => {
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
    try {
        const info = await transport.sendMail({
            from: `"${APP_BRAND.name}" <${MAIL_CONFIG.from}>`,
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
        });
        return {
            sent: true,
            skipped: false,
            messageId: info.messageId,
        };
    }
    catch (err) {
        // Bad credentials / network must not break signup/login flows.
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
export const sendTemplatedEmail = async (input) => {
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
export const previewTemplate = (subject, body, vars = {}) => {
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
    return {
        subject: renderTemplate(subject, merged),
        html: renderTemplate(body, merged),
    };
};
//# sourceMappingURL=mail.js.map