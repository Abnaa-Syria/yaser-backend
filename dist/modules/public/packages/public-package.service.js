import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { PAYMENT_CONFIG } from '../../../config/payment.config.js';
/**
 * List active course bundles.
 */
export const getPackages = async () => {
    const packages = await prisma.coursePackage.findMany({
        where: { isActive: true, publishStatus: 'PUBLISHED' },
        orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
        include: {
            courses: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            titleAr: true,
                            slug: true,
                            thumbnail: true,
                            shortDescription: true,
                            shortDescriptionAr: true,
                        },
                    },
                },
            },
            pricingTiers: {
                where: { isActive: true },
                orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
            },
        },
    });
    return packages.map((pkg) => ({ ...pkg, paymentInstructions: PAYMENT_CONFIG }));
};
/**
 * Get course bundle details.
 */
export const getPackageById = async (id) => {
    const coursePackage = await prisma.coursePackage.findFirst({
        where: { id, isActive: true, publishStatus: 'PUBLISHED' },
        include: {
            courses: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            titleAr: true,
                            slug: true,
                            thumbnail: true,
                            shortDescription: true,
                            shortDescriptionAr: true,
                        },
                    },
                },
            },
            pricingTiers: {
                where: { isActive: true },
                orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
            },
        },
    });
    if (!coursePackage)
        throw new AppError('Package not found.', 404);
    return { ...coursePackage, paymentInstructions: PAYMENT_CONFIG };
};
//# sourceMappingURL=public-package.service.js.map