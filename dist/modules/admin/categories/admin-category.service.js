import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const createCategory = async (data) => {
    const existing = await prisma.category.findFirst({
        where: { OR: [{ name: data.name }, { slug: data.slug }] }
    });
    if (existing)
        throw new AppError('Category name or slug already exists', 400);
    return await prisma.category.create({
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            parentId: data.parentId || null,
            icon: data.icon || null
        }
    });
};
export const updateCategory = async (id, data) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category)
        throw new AppError('Category not found', 404);
    return await prisma.category.update({
        where: { id },
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            parentId: data.parentId === "" ? null : (data.parentId !== undefined ? data.parentId : undefined),
            icon: data.icon !== undefined ? data.icon : undefined
        },
    });
};
export const deleteCategory = async (id) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category)
        throw new AppError('Category not found', 404);
    await prisma.category.delete({ where: { id } });
    return null;
};
export const getAllCategories = async (options) => {
    const { search } = options;
    const page = Number(options?.page) > 0 ? Number(options.page) : 1;
    const limit = Number(options?.limit) > 0 ? Number(options.limit) : 200; // Increase limit for list page
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }
    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            where,
            skip,
            take: limit,
            include: {
                parent: { select: { id: true, name: true } },
                _count: { select: { courses: true } }
            },
            orderBy: { name: 'asc' }
        }),
        prisma.category.count({ where })
    ]);
    return { categories, total, page, limit };
};
export const getCategoryById = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            courses: {
                take: 5,
                select: { id: true, title: true, thumbnail: true }
            }
        }
    });
    if (!category)
        throw new AppError('Category not found', 404);
    return category;
};
//# sourceMappingURL=admin-category.service.js.map