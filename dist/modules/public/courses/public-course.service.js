import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { notDeleted } from '../../../utils/soft-delete.js';
import { PAYMENT_CONFIG } from '../../../config/payment.config.js';
const publicCurriculumSelect = {
    units: {
        orderBy: { order: 'asc' },
        select: {
            id: true,
            title: true,
            order: true,
            sections: {
                where: notDeleted(),
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    order: true,
                    lessons: {
                        where: notDeleted(),
                        orderBy: { order: 'asc' },
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            durationSeconds: true,
                        },
                    },
                },
            },
        },
    },
    exams: {
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            title: true,
            type: true,
            unitId: true,
            lessonId: true,
        },
    },
};
const recommendedCourseSelect = {
    id: true,
    title: true,
    description: true,
    thumbnail: true,
    type: true,
    price: true,
    isLifetimePurchasable: true,
    category: {
        select: { id: true, name: true, slug: true },
    },
    instructor: {
        select: {
            id: true,
            fullName: true,
            avatar: true,
        },
    },
    _count: {
        select: { purchases: true },
    },
};
async function enrichCoursesWithStats(courses) {
    if (!courses.length)
        return [];
    const ids = courses.map((c) => c.id);
    const ratingRows = await prisma.courseReview.groupBy({
        by: ['courseId'],
        where: { courseId: { in: ids }, isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
    });
    const ratingMap = new Map(ratingRows.map((row) => [
        row.courseId,
        {
            rating: row._avg.rating != null ? Math.round(row._avg.rating * 10) / 10 : null,
            reviewCount: row._count._all,
        },
    ]));
    const purchaseCounts = courses.map((c) => c._count.purchases).sort((a, b) => b - a);
    const bestsellerThreshold = purchaseCounts[Math.min(2, purchaseCounts.length - 1)] ?? 1;
    return courses.map((course) => {
        const stats = ratingMap.get(course.id);
        const purchaseCount = course._count.purchases;
        return {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            type: course.type,
            price: course.price,
            isLifetimePurchasable: course.isLifetimePurchasable,
            category: course.category,
            instructor: course.instructor,
            purchaseCount,
            rating: stats?.rating ?? null,
            reviewCount: stats?.reviewCount ?? 0,
            isBestSeller: purchaseCount >= bestsellerThreshold && purchaseCount > 0,
        };
    });
}
/**
 * Featured / recommended courses for the public landing page.
 */
export const getRecommendedPublicCourses = async (query) => {
    const filter = String(query.filter || 'bestseller').toLowerCase();
    const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 24);
    const baseWhere = {
        ...notDeleted(),
        isActive: true,
        isLifetimePurchasable: true,
    };
    const categories = await prisma.category.findMany({
        where: {
            courses: {
                some: baseWhere,
            },
        },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: {
                select: {
                    courses: { where: baseWhere },
                },
            },
        },
    });
    const totalCourses = await prisma.course.count({ where: baseWhere });
    const tabs = [
        {
            id: 'bestseller',
            label: 'Best Sellers',
            labelAr: 'أكثر مبيعاً',
            courseCount: totalCourses,
        },
        ...categories.map((cat) => ({
            id: cat.slug,
            label: cat.name,
            labelAr: cat.name,
            courseCount: cat._count.courses,
        })),
        {
            id: 'all',
            label: 'All Courses',
            labelAr: 'جميع الدورات',
            courseCount: totalCourses,
        },
    ];
    const where = { ...baseWhere };
    if (filter === 'recorded') {
        where.type = 'RECORDED';
    }
    else if (filter !== 'bestseller' && filter !== 'all' && filter !== 'live' && filter !== 'hybrid') {
        where.category = { slug: filter };
    }
    const rows = await prisma.course.findMany({
        where,
        take: Math.max(limit * 4, 32),
        orderBy: { createdAt: 'desc' },
        select: recommendedCourseSelect,
    });
    const sorted = filter === 'bestseller' || filter === 'all'
        ? [...rows].sort((a, b) => b._count.purchases - a._count.purchases)
        : [...rows].sort((a, b) => b._count.purchases - a._count.purchases);
    const courses = (await enrichCoursesWithStats(sorted)).slice(0, limit);
    return { tabs, courses, filter };
};
/**
 * List all active courses with pagination
 */
export const getPublicCourses = async (query) => {
    const { page = '1', limit = '10', search, category } = query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    const where = notDeleted({ isActive: true });
    if (search) {
        where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
    }
    const categorySlug = typeof category === 'string' ? category.trim() : '';
    if (categorySlug && categorySlug !== 'all' && categorySlug !== 'recorded') {
        const cat = await prisma.category.findUnique({
            where: { slug: categorySlug },
            select: { id: true, children: { select: { id: true } } },
        });
        if (cat) {
            const categoryIds = [cat.id, ...cat.children.map((c) => c.id)];
            where.categoryId = { in: categoryIds };
        }
        else {
            where.category = { slug: categorySlug };
        }
    }
    else if (categorySlug === 'recorded') {
        where.type = 'RECORDED';
    }
    const [courses, total] = await prisma.$transaction([
        prisma.course.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                titleAr: true,
                slug: true,
                shortDescription: true,
                shortDescriptionAr: true,
                description: true,
                descriptionAr: true,
                thumbnail: true,
                coverImage: true,
                type: true,
                price: true,
                isFeatured: true,
                isLifetimePurchasable: true,
                category: {
                    select: { id: true, name: true, nameAr: true, slug: true, icon: true },
                },
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                pricingTiers: {
                    where: { isActive: true },
                    orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        label: true,
                        labelAr: true,
                        price: true,
                        originalPrice: true,
                        currency: true,
                        durationDays: true,
                        durationValue: true,
                        durationUnit: true,
                        badge: true,
                    },
                },
                _count: {
                    select: { purchases: true, units: true },
                },
            },
        }),
        prisma.course.count({ where }),
    ]);
    return {
        courses,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};
/**
 * Get detailed course view by ID
 */
export const getPublicCourseById = async (id) => {
    const course = await prisma.course.findFirst({
        where: notDeleted({ id, isActive: true }),
        select: {
            id: true,
            title: true,
            titleAr: true,
            slug: true,
            shortDescription: true,
            shortDescriptionAr: true,
            description: true,
            descriptionAr: true,
            thumbnail: true,
            coverImage: true,
            introVideoUrl: true,
            type: true,
            price: true,
            isFeatured: true,
            isLifetimePurchasable: true,
            category: {
                select: { id: true, name: true, nameAr: true, slug: true },
            },
            instructor: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true,
                    bio: true,
                },
            },
            pricingTiers: {
                where: { isActive: true },
                orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
                select: {
                    id: true,
                    name: true,
                    nameAr: true,
                    label: true,
                    labelAr: true,
                    price: true,
                    originalPrice: true,
                    currency: true,
                    durationDays: true,
                    durationValue: true,
                    durationUnit: true,
                    description: true,
                    descriptionAr: true,
                    badge: true,
                },
            },
            ...publicCurriculumSelect,
            _count: {
                select: { purchases: true },
            },
        },
    });
    if (!course)
        throw new AppError('Course not found.', 404);
    return {
        ...course,
        paymentInstructions: PAYMENT_CONFIG,
    };
};
//# sourceMappingURL=public-course.service.js.map