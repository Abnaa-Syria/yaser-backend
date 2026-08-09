import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
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
//# sourceMappingURL=admin-settings.service.js.map