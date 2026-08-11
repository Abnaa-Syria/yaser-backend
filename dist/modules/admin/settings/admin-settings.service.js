import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { previewTemplate, sendMail } from '../../../utils/mail.js';
function toJsonValue(value) {
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    return String(value);
}
// --- Global Settings ---
export const getAllSettings = async () => {
    return await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
};
export const updateSettings = async (settings) => {
    const entries = Object.entries(settings).filter(([key]) => key?.length > 0);
    if (entries.length === 0) {
        throw new AppError('No settings provided', 400);
    }
    const updates = entries.map(([key, value]) => prisma.platformSetting.upsert({
        where: { key },
        update: { value: toJsonValue(value) },
        create: { key, value: toJsonValue(value) },
    }));
    return await prisma.$transaction(updates);
};
// --- Email Templates ---
export const getAllEmailTemplates = async () => {
    return await prisma.emailTemplate.findMany();
};
export const createEmailTemplate = async (data) => {
    return await prisma.emailTemplate.create({ data });
};
export const updateEmailTemplate = async (id, data) => {
    return await prisma.emailTemplate.update({
        where: { id },
        data
    });
};
export const deleteEmailTemplate = async (id) => {
    return await prisma.emailTemplate.delete({ where: { id } });
};
export const previewEmailTemplate = async (input) => {
    let subject = input.subject;
    let body = input.body;
    if (input.id) {
        const template = await prisma.emailTemplate.findUnique({ where: { id: input.id } });
        if (!template)
            throw new AppError('Email template not found', 404);
        subject = subject || template.subject;
        body = body || template.body;
    }
    if (!subject || !body) {
        throw new AppError('Subject and body are required for preview', 400);
    }
    return previewTemplate(subject, body, input.vars);
};
export const sendTestEmailTemplate = async (input) => {
    const preview = await previewEmailTemplate(input);
    const result = await sendMail({
        to: input.to,
        subject: `[TEST] ${preview.subject}`,
        html: preview.html,
    });
    if (!result.sent && result.skipped) {
        throw new AppError('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send email.', 503);
    }
    return { ...result, preview };
};
//# sourceMappingURL=admin-settings.service.js.map