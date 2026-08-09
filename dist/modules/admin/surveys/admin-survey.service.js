import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
// ─── List All Survey Questions ─────────────────────────────────────────────────
export const listSurveyQuestions = async () => {
    return prisma.surveyQuestion.findMany({
        orderBy: [{ category: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });
};
// ─── Create Survey Question ────────────────────────────────────────────────────
export const createSurveyQuestion = async (data) => {
    return prisma.surveyQuestion.create({
        data: {
            textAr: data.textAr,
            textEn: data.textEn,
            type: data.type,
            category: data.category,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
    });
};
// ─── Update Survey Question ────────────────────────────────────────────────────
export const updateSurveyQuestion = async (id, data) => {
    const existing = await prisma.surveyQuestion.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError('Survey question not found.', 404);
    }
    const updateData = {};
    if (data.textAr !== undefined)
        updateData.textAr = data.textAr;
    if (data.textEn !== undefined)
        updateData.textEn = data.textEn;
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.category !== undefined)
        updateData.category = data.category;
    if (data.isActive !== undefined)
        updateData.isActive = data.isActive;
    if (data.order !== undefined)
        updateData.order = data.order;
    return prisma.surveyQuestion.update({
        where: { id },
        data: updateData,
    });
};
// ─── Delete Survey Question ────────────────────────────────────────────────────
export const deleteSurveyQuestion = async (id) => {
    const existing = await prisma.surveyQuestion.findUnique({
        where: { id },
        include: { _count: { select: { responses: true } } },
    });
    if (!existing) {
        throw new AppError('Survey question not found.', 404);
    }
    if (existing._count.responses > 0) {
        throw new AppError(`Cannot delete this question — it has ${existing._count.responses} student response(s) linked to it. Deactivate it instead (isActive: false).`, 409);
    }
    await prisma.surveyQuestion.delete({ where: { id } });
    return { id, deleted: true };
};
//# sourceMappingURL=admin-survey.service.js.map