import { prisma } from '../../../prisma.js';

/**
 * Create a new unit within a course
 */
export const createUnit = async (data: { title: string; order: number; courseId: string }) => {
  const unit = await prisma.unit.create({
    data: {
      title: data.title,
      order: data.order,
      courseId: data.courseId,
    },
    select: {
      id: true,
      title: true,
      order: true,
      courseId: true,
    },
  });
  return unit;
};

/**
 * Update unit details
 */
export const updateUnit = async (id: string, data: { title?: string; order?: number }) => {
  const unit = await prisma.unit.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      order: true,
    },
  });
  return unit;
};

/**
 * Delete a unit (Cascades to sections/lessons via schema)
 */
export const deleteUnit = async (id: string) => {
  await prisma.unit.delete({ where: { id } });

  return { id, deleted: true };
};

export const getAllUnits = async (options: any) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const { courseId } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (courseId) where.courseId = courseId;

  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      skip,
      take: limit,
      include: {
        course: { select: { title: true } },
        sections: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
    }),
    prisma.unit.count({ where }),
  ]);

  const unitsWithLessonCount = units.map(({ sections, ...unit }) => ({
    ...unit,
    _count: {
      lessons: sections.reduce((sum, section) => sum + section._count.lessons, 0),
    },
  }));

  return { units: unitsWithLessonCount, total, page, limit };
};

export const getUnitById = async (id: string) => {
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { _count: { select: { resources: true } } },
          },
        },
      },
    },
  });
  if (!unit) throw new Error('Unit not found');
  return unit;
};
