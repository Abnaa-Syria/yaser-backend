import { PLATFORM_CURRENCY } from '../../../config/currency.js';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

export const createPackage = async (data: {
  title: string;
  titleAr?: string;
  slug?: string;
  shortDescription?: string;
  shortDescriptionAr?: string;
  description?: string;
  descriptionAr?: string;
  coverImage?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  isActive?: boolean;
  publishStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured?: boolean;
  displayOrder?: number;
  courseIds?: string[];
  pricingTiers?: Array<{
    name: string;
    nameAr?: string;
    label?: string;
    labelAr?: string;
    price: number;
    originalPrice?: number;
    currency?: string;
    durationDays: number | null;
    durationValue?: number | null;
    durationUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'LIFETIME' | null;
    isActive?: boolean;
    displayOrder?: number;
    description?: string;
    descriptionAr?: string;
  }>;
}) => {
  const isActive = data.isActive !== undefined ? data.isActive : true;
  const publishStatus =
    data.publishStatus ?? (isActive ? 'PUBLISHED' : 'DRAFT');

  return prisma.$transaction(async (tx) => {
    const pkg = await tx.coursePackage.create({
      data: {
        title: data.title,
        titleAr: data.titleAr,
        slug: data.slug,
        shortDescription: data.shortDescription,
        shortDescriptionAr: data.shortDescriptionAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        coverImage: data.coverImage,
        price: data.price,
        originalPrice: data.originalPrice,
        currency: PLATFORM_CURRENCY,
        isActive,
        publishStatus,
        isFeatured: data.isFeatured,
        displayOrder: data.displayOrder,
        courses: data.courseIds ? {
          create: data.courseIds.map((courseId) => ({ courseId }))
        } : undefined,
        pricingTiers: data.pricingTiers ? {
          create: data.pricingTiers.map((tier) => ({
            name: tier.name,
            nameAr: tier.nameAr,
            label: tier.label,
            labelAr: tier.labelAr,
            price: tier.price,
            originalPrice: tier.originalPrice,
            currency: PLATFORM_CURRENCY,
            durationDays: tier.durationDays,
            durationValue: tier.durationValue,
            durationUnit: tier.durationUnit,
            isActive: tier.isActive !== undefined ? tier.isActive : true,
            displayOrder: tier.displayOrder,
            description: tier.description,
            descriptionAr: tier.descriptionAr,
          }))
        } : undefined
      },
      include: {
        pricingTiers: true,
        courses: {
          include: {
            course: { select: { id: true, title: true, price: true } }
          }
        }
      }
    });
    return pkg;
  });
};

export const getAllPackages = async () => {
  return prisma.coursePackage.findMany({
    include: {
      pricingTiers: true,
      courses: {
        include: {
          course: {
            select: { id: true, title: true, price: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getPackageById = async (id: string) => {
  const pkg = await prisma.coursePackage.findUnique({
    where: { id },
    include: {
      pricingTiers: true,
      courses: {
        include: {
          course: {
            select: { id: true, title: true, price: true }
          }
        }
      }
    }
  });
  if (!pkg) throw new AppError('Course package not found', 404);
  return pkg;
};

export const updatePackage = async (
  id: string,
  data: {
    title?: string;
    titleAr?: string;
    slug?: string;
    shortDescription?: string;
    shortDescriptionAr?: string;
    description?: string;
    descriptionAr?: string;
    coverImage?: string;
    price?: number;
    originalPrice?: number;
    currency?: string;
    isActive?: boolean;
    publishStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isFeatured?: boolean;
    displayOrder?: number;
    courseIds?: string[];
    pricingTiers?: Array<{
      id?: string;
      name: string;
      nameAr?: string;
      label?: string;
      labelAr?: string;
      price: number;
      originalPrice?: number;
      currency?: string;
      durationDays: number | null;
      durationValue?: number | null;
      durationUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'LIFETIME' | null;
      isActive?: boolean;
      displayOrder?: number;
      description?: string;
      descriptionAr?: string;
    }>;
  }
) => {
  return prisma.$transaction(async (tx) => {
    const publishStatus =
      data.publishStatus !== undefined
        ? data.publishStatus
        : data.isActive === undefined
          ? undefined
          : data.isActive
            ? 'PUBLISHED'
            : 'DRAFT';

    await tx.coursePackage.update({
      where: { id },
      data: {
        title: data.title,
        titleAr: data.titleAr,
        slug: data.slug,
        shortDescription: data.shortDescription,
        shortDescriptionAr: data.shortDescriptionAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        coverImage: data.coverImage,
        price: data.price,
        originalPrice: data.originalPrice,
        currency: PLATFORM_CURRENCY,
        isActive: data.isActive,
        publishStatus,
        isFeatured: data.isFeatured,
        displayOrder: data.displayOrder,
      }
    });

    if (data.courseIds !== undefined) {
      await tx.coursePackageItem.deleteMany({
        where: {
          packageId: id,
          courseId: { notIn: data.courseIds }
        }
      });

      const existingItems = await tx.coursePackageItem.findMany({
        where: { packageId: id }
      });
      const existingCourseIds = existingItems.map(item => item.courseId);

      const newCourseIds = data.courseIds.filter(courseId => !existingCourseIds.includes(courseId));
      if (newCourseIds.length > 0) {
        await tx.coursePackageItem.createMany({
          data: newCourseIds.map(courseId => ({
            packageId: id,
            courseId
          }))
        });
      }
    }

    if (data.pricingTiers !== undefined) {
      const incomingTiers = data.pricingTiers || [];
      const existingTiers = await tx.coursePackagePricingTier.findMany({
        where: { packageId: id }
      });

      const incomingIds = incomingTiers.map((t) => t.id).filter(Boolean) as string[];
      const tiersToDelete = existingTiers.filter(t => !incomingIds.includes(t.id));

      if (tiersToDelete.length > 0) {
        await tx.coursePackagePricingTier.deleteMany({
          where: { id: { in: tiersToDelete.map(t => t.id) } }
        });
      }

      for (const tier of incomingTiers) {
        if (tier.id) {
          await tx.coursePackagePricingTier.update({
            where: { id: tier.id },
            data: {
              name: tier.name,
              nameAr: tier.nameAr,
              label: tier.label,
              labelAr: tier.labelAr,
              price: tier.price,
              originalPrice: tier.originalPrice,
              currency: PLATFORM_CURRENCY,
              durationDays: tier.durationDays,
              durationValue: tier.durationValue,
              durationUnit: tier.durationUnit,
              isActive: tier.isActive !== undefined ? tier.isActive : true,
              displayOrder: tier.displayOrder,
              description: tier.description,
              descriptionAr: tier.descriptionAr,
            }
          });
        } else {
          await tx.coursePackagePricingTier.create({
            data: {
              packageId: id,
              name: tier.name,
              nameAr: tier.nameAr,
              label: tier.label,
              labelAr: tier.labelAr,
              price: tier.price,
              originalPrice: tier.originalPrice,
              currency: PLATFORM_CURRENCY,
              durationDays: tier.durationDays,
              durationValue: tier.durationValue,
              durationUnit: tier.durationUnit,
              isActive: tier.isActive !== undefined ? tier.isActive : true,
              displayOrder: tier.displayOrder,
              description: tier.description,
              descriptionAr: tier.descriptionAr,
            }
          });
        }
      }
    }

    return await tx.coursePackage.findUnique({
      where: { id },
      include: {
        pricingTiers: true,
        courses: {
          include: {
            course: { select: { id: true, title: true, price: true } }
          }
        }
      }
    });
  });
};

export const deletePackage = async (id: string) => {
  await prisma.coursePackage.delete({ where: { id } });
  return { id, deleted: true };
};
