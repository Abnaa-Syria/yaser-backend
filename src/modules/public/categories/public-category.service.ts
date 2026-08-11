import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { notDeleted } from '../../../utils/soft-delete.js';

export const getAllCategories = async () => {
  const list = await prisma.category.findMany({
    where: {
      parentId: null,
      status: 'PUBLISHED',
    },
    include: {
      children: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      },
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  // Legacy fallback if nothing is marked PUBLISHED yet
  const categories =
    list.length > 0
      ? list
      : await prisma.category.findMany({
          where: { parentId: null },
          include: {
            children: {
              orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            },
          },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });

  return Promise.all(
    categories.map(async (cat) => {
      const categoryIds = [cat.id, ...cat.children.map((c) => c.id)];
      const courseCount = await prisma.course.count({
        where: notDeleted({ isActive: true, categoryId: { in: categoryIds } }),
      });
      return {
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr,
        slug: cat.slug,
        description: cat.description,
        descriptionAr: cat.descriptionAr,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        courseCount,
        children: cat.children.map((c) => ({
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          slug: c.slug,
          icon: c.icon,
        })),
      };
    })
  );
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: true,
    },
  });

  if (!category) throw new AppError('Category not found', 404);

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const courses = await prisma.course.findMany({
    where: {
      ...notDeleted(),
      isActive: true,
      categoryId: { in: categoryIds },
      status: 'APPROVED',
    },
    include: {
      instructor: { select: { fullName: true, avatar: true } },
    },
  });

  return {
    ...category,
    courses,
  };
};
