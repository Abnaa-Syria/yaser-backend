import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { notDeleted, softDeleteData } from '../../../utils/soft-delete.js';
export const createSection = async (data) => {
    const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
    if (!unit)
        throw new AppError('Unit not found', 404);
    return prisma.section.create({
        data: {
            unitId: data.unitId,
            title: data.title,
            order: data.order,
        },
    });
};
export const getSections = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where = notDeleted(query.unitId ? { unitId: query.unitId } : {});
    const [sections, total] = await Promise.all([
        prisma.section.findMany({
            where,
            skip,
            take: limit,
            orderBy: { order: 'asc' },
            include: {
                _count: { select: { lessons: true } },
                unit: { select: { id: true, title: true, courseId: true } },
            },
        }),
        prisma.section.count({ where }),
    ]);
    return { sections, total, page, limit };
};
export const getSectionById = async (id) => {
    const section = await prisma.section.findFirst({
        where: notDeleted({ id }),
        include: {
            unit: { select: { id: true, title: true, courseId: true } },
            lessons: {
                where: notDeleted(),
                orderBy: { order: 'asc' },
            },
        },
    });
    if (!section)
        throw new AppError('Section not found', 404);
    return section;
};
export const updateSection = async (id, data) => {
    await getSectionById(id);
    return prisma.section.update({ where: { id }, data });
};
export const deleteSection = async (id) => {
    await getSectionById(id);
    await prisma.section.update({ where: { id }, data: softDeleteData() });
    return { id, deleted: true };
};
//# sourceMappingURL=admin-section.service.js.map