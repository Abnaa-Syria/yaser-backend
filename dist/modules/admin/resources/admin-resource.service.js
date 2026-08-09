import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const createResource = async (lessonId, data) => {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson)
        throw new AppError('Lesson not found', 404);
    return await prisma.lessonResource.create({
        data: {
            lessonId,
            resourceType: data.resourceType ?? 'PDF',
            ...data,
        },
    });
};
export const deleteResource = async (resourceId) => {
    const resource = await prisma.lessonResource.findUnique({ where: { id: resourceId } });
    if (!resource)
        throw new AppError('Resource not found', 404);
    await prisma.lessonResource.delete({ where: { id: resourceId } });
    return null;
};
export const getAllResources = async (options) => {
    const { page = 1, limit = 10, lessonId } = options;
    const skip = (page - 1) * limit;
    const where = {};
    if (lessonId)
        where.lessonId = lessonId;
    const [resources, total] = await Promise.all([
        prisma.lessonResource.findMany({
            where,
            skip,
            take: limit,
            include: {
                lesson: {
                    select: {
                        title: true,
                        section: { select: { title: true, unit: { select: { title: true, course: { select: { title: true } } } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.lessonResource.count({ where })
    ]);
    return { resources, total, page, limit };
};
export const getResourceById = async (id) => {
    const resource = await prisma.lessonResource.findUnique({
        where: { id },
        include: {
            lesson: { include: { section: { include: { unit: { include: { course: true } } } } } },
        }
    });
    if (!resource)
        throw new AppError('Resource not found', 404);
    return resource;
};
//# sourceMappingURL=admin-resource.service.js.map