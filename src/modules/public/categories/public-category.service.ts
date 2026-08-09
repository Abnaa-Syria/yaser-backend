import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

export const getAllCategories = async () => {
  // Retrieve top-level categories with their child subcategories
  return prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: true,
    },
  });

  if (!category) throw new AppError('Category not found', 404);

  // Aggregate courses from this category and all its subcategories
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const courses = await prisma.course.findMany({
    where: {
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
