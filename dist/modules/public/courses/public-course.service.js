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
                            isLive: true,
                            durationSeconds: true,
                        },
                    },
                },
            },
        },
    },
    homeworks: {
        orderBy: { dueDate: 'asc' },
        select: {
            id: true,
            title: true,
            dueDate: true,
            unitId: true,
            lessons: {
                select: { lessonId: true },
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
    if (filter === 'live' || filter === 'hybrid') {
        where.type = 'HYBRID';
    }
    else if (filter === 'recorded') {
        where.type = 'RECORDED';
    }
    else if (filter !== 'bestseller' && filter !== 'all') {
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
    const { page = '1', limit = '10', search } = query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    const where = { isActive: true };
    if (search) {
        where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
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
                    select: { id: true, name: true, slug: true },
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
    const course = await prisma.course.findUnique({
        where: { id, isActive: true },
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
            liveSessions: {
                where: { status: { in: ['UPCOMING', 'ONGOING'] }, type: 'GROUP' },
                orderBy: { startTime: 'asc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    status: true,
                    startTime: true,
                    endTime: true,
                    price: true,
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
    const homeworks = course.homeworks.map((hw) => ({
        id: hw.id,
        title: hw.title,
        dueDate: hw.dueDate,
        unitId: hw.unitId,
        lessonIds: hw.lessons.map((link) => link.lessonId),
    }));
    const { homeworks: _hw, ...rest } = course;
    return {
        ...rest,
        homeworks,
        paymentInstructions: PAYMENT_CONFIG,
    };
};
//# sourceMappingURL=public-course.service.js.map