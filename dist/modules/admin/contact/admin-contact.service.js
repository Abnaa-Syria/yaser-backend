import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const listContactSubmissions = async (query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = query.status ? String(query.status) : undefined;
    const where = status ? { status: status } : {};
    const [rows, total] = await Promise.all([
        prisma.contactSubmission.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.contactSubmission.count({ where }),
    ]);
    return { submissions: rows, total, page, limit };
};
export const updateContactSubmissionStatus = async (id, status) => {
    const row = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!row)
        throw new AppError('Submission not found', 404);
    return prisma.contactSubmission.update({ where: { id }, data: { status } });
};
//# sourceMappingURL=admin-contact.service.js.map