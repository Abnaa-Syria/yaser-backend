import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const toggleReviewVisibility = async (reviewId) => {
    const review = await prisma.courseReview.findUnique({ where: { id: reviewId } });
    return await prisma.courseReview.update({
        where: { id: reviewId },
        data: { isVisible: !review?.isVisible }
    });
};
export const togglePackageVisibility = async (planId) => {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    return await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive: !plan?.isActive },
    });
};
export const upsertSection = async (key, content) => {
    return await prisma.homePageSection.upsert({
        where: { key },
        update: { content },
        create: { key, content }
    });
};
export const upsertSectionByKey = async (key, data) => {
    const content = data.content;
    return prisma.homePageSection.upsert({
        where: { key },
        update: {
            content,
            ...(data.isVisible !== undefined ? { isVisible: data.isVisible } : {}),
            ...(data.order !== undefined ? { order: data.order } : {}),
        },
        create: {
            key,
            content,
            isVisible: data.isVisible ?? true,
            order: data.order ?? 0,
        },
    });
};
export const updateHeroSection = async (data) => {
    const content = { headline: data.headline, subheadline: data.subheadline };
    return prisma.homePageSection.upsert({
        where: { key: 'HERO' },
        update: {
            content,
            ...(data.isVisible !== undefined ? { isVisible: data.isVisible } : {}),
        },
        create: {
            key: 'HERO',
            content,
            order: 0,
            isVisible: data.isVisible ?? true,
        },
    });
};
export const getFaqSection = async () => {
    const section = await prisma.homePageSection.findUnique({ where: { key: 'FAQ' } });
    const raw = section?.content;
    const rawList = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray(raw.items)
            ? (raw.items)
            : [];
    const normalized = normalizeFaqList(raw);
    // Persist cleanup when duplicates or bad shape exist.
    if (section && (rawList.length !== normalized.length || (raw && !Array.isArray(raw)))) {
        await upsertSection('FAQ', normalized);
    }
    return normalized;
};
function localizeText(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const o = value;
        return {
            en: String(o.en ?? o.EN ?? '').trim(),
            ar: String(o.ar ?? o.AR ?? '').trim(),
        };
    }
    const s = String(value ?? '').trim();
    return { en: s, ar: s };
}
function faqFingerprint(item) {
    const q = localizeText(item.question);
    return (q.en || q.ar).toLowerCase();
}
function normalizeFaqList(content) {
    const list = Array.isArray(content)
        ? content
        : content && typeof content === 'object' && Array.isArray(content.items)
            ? (content.items)
            : [];
    const seen = new Set();
    const out = [];
    for (const raw of list) {
        if (!raw || typeof raw !== 'object')
            continue;
        const item = raw;
        const key = faqFingerprint(item);
        if (!key || seen.has(key))
            continue;
        seen.add(key);
        out.push({
            id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
            question: item.question,
            answer: item.answer,
            ...(item.createdAt ? { createdAt: item.createdAt } : {}),
        });
    }
    return out;
}
const DEFAULT_FAQ_ITEMS = [
    {
        question: {
            en: 'What is the learning format at Yaser USMLE?',
            ar: 'ما هي صيغة التعلم في منصة Yaser USMLE؟',
        },
        answer: {
            en: 'We offer structured, systems-based recorded courses combined with practice quizzes, flashcards, and a study planner — all in one platform designed specifically for USMLE Step 1 preparation.',
            ar: 'نقدم دورات مسجلة منظمة حسب أنظمة الأعضاء، مع اختبارات تدريبية وفلاش كاردز وخطط مذاكرة — كل ذلك في منصة واحدة مصممة للتحضير لـ USMLE Step 1.',
        },
    },
    {
        question: {
            en: 'Who are the courses designed for?',
            ar: 'لمن تم تصميم هذه الدورات التدريبية؟',
        },
        answer: {
            en: 'For medical students and graduates preparing for USMLE Step 1 who want a structured, evidence-based approach guided by expert educators.',
            ar: 'لطلاب الطب والخريجين المتحضرين لـ USMLE Step 1 ممن يريدون نهجاً منظماً ومبنياً على الأدلة تحت إشراف معلمين خبراء.',
        },
    },
    {
        question: {
            en: 'How do I access a course after enrolling?',
            ar: 'كيف يمكنني الوصول للدورة بعد التسجيل؟',
        },
        answer: {
            en: 'After your enrollment is approved, you will have immediate access to all course lectures, materials, quizzes, and flashcards from your student dashboard.',
            ar: 'بعد الموافقة على طلب التسجيل، ستحصل فوراً على وصول كامل لجميع محاضرات الدورة والمواد والاختبارات والفلاش كاردز من لوحة تحكم الطالب.',
        },
    },
    {
        question: {
            en: 'What payment methods are supported?',
            ar: 'ما هي طرق الدفع المتاحة؟',
        },
        answer: {
            en: 'We support manual bank transfer payments. Upload your payment proof and our team will verify and activate your access within one business day.',
            ar: 'ندعم الدفع عبر التحويل البنكي اليدوي. ارفع إيصال الدفع وسيقوم فريقنا بالتحقق منه وتفعيل الوصول في غضون يوم عمل واحد.',
        },
    },
    {
        question: {
            en: 'Is content available in Arabic and English?',
            ar: 'هل المحتوى متاح بالعربية والإنجليزية؟',
        },
        answer: {
            en: 'The platform interface supports Arabic and English. Each course page identifies the teaching language and available materials before enrollment.',
            ar: 'تدعم المنصة الواجهة العربية والإنجليزية، وتوضح صفحة كل دورة لغة الشرح والمواد المتاحة قبل التسجيل.',
        },
    },
    {
        question: {
            en: 'What should I do if I have an account or access issue?',
            ar: 'ماذا أفعل إذا واجهت مشكلة في الحساب أو الوصول؟',
        },
        answer: {
            en: 'Contact our support team from the contact page or open a ticket from your student dashboard, and we will review any account, payment, or access issue.',
            ar: 'يمكنك التواصل مع فريق الدعم من صفحة اتصل بنا أو فتح تذكرة من لوحة الطالب، وسنراجع مشكلة الحساب أو الدفع أو الوصول.',
        },
    },
];
/** Import built-in FAQs into CMS so they become editable (skips duplicates). */
export const importDefaultFaqs = async () => {
    const existing = await getFaqSection();
    const seen = new Set(existing.map((item) => faqFingerprint(item)));
    const added = [];
    for (const def of DEFAULT_FAQ_ITEMS) {
        const key = (def.question.en || def.question.ar).toLowerCase();
        if (!key || seen.has(key))
            continue;
        seen.add(key);
        added.push({
            id: crypto.randomUUID(),
            question: def.question,
            answer: def.answer,
            createdAt: new Date().toISOString(),
        });
    }
    const next = [...existing, ...added];
    await upsertSection('FAQ', next);
    return { faqs: next, imported: added.length };
};
export const getAllSections = async () => {
    return await prisma.homePageSection.findMany({ orderBy: { order: 'asc' } });
};
export const createSection = async (data) => {
    return await prisma.homePageSection.create({ data });
};
export const updateSectionById = async (id, data) => {
    return await prisma.homePageSection.update({ where: { id }, data });
};
export const deleteSection = async (id) => {
    await prisma.homePageSection.delete({ where: { id } });
    return { id, deleted: true };
};
// --- FAQ Granular Management ---
export const addFaqItem = async (data) => {
    const faqs = await getFaqSection();
    const newItem = { id: crypto.randomUUID(), ...data, createdAt: new Date() };
    faqs.push(newItem);
    return await upsertSection('FAQ', faqs);
};
export const updateFaqItem = async (itemId, data) => {
    let faqs = await getFaqSection();
    faqs = faqs.map((item) => (item.id === itemId ? { ...item, ...data } : item));
    return await upsertSection('FAQ', faqs);
};
export const deleteFaqItem = async (itemId) => {
    let faqs = await getFaqSection();
    faqs = faqs.filter((item) => item.id !== itemId);
    return await upsertSection('FAQ', faqs);
};
// --- Reviews & Social Proof ---
export const getAllReviews = async () => {
    return await prisma.courseReview.findMany({
        include: {
            student: { select: { fullName: true, avatar: true } },
            course: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
export const toggleFeatureReview = async (id, isFeatured) => {
    return await prisma.courseReview.update({
        where: { id },
        data: { isFeatured }
    });
};
// --- Subscription plans (legacy "packages" CMS) ---
export const getAllPackages = async () => {
    return await prisma.subscriptionPlan.findMany({ orderBy: { durationMonths: 'asc' } });
};
export const updatePackageStatus = async (id, data) => {
    return await prisma.subscriptionPlan.update({
        where: { id },
        data,
    });
};
export const createPackage = async (data) => {
    return await prisma.subscriptionPlan.create({ data });
};
export const updatePackage = async (id, data) => {
    return await prisma.subscriptionPlan.update({
        where: { id },
        data,
    });
};
export const deletePackage = async (id) => {
    await prisma.subscriptionPlan.delete({ where: { id } });
    return { id, deleted: true };
};
// --- Posts ---
export const getAllPosts = async (query) => {
    const { page = 1, limit = 10, published } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (published !== undefined)
        where.published = published === 'true';
    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            skip,
            take: Number(limit),
            include: { author: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.post.count({ where })
    ]);
    return { posts, total, page, limit };
};
export const createPost = async (authorId, data) => {
    return await prisma.post.create({
        data: { ...data, authorId }
    });
};
export const updatePost = async (id, data) => {
    return await prisma.post.update({
        where: { id },
        data
    });
};
export const deletePost = async (id) => {
    return await prisma.post.delete({ where: { id } });
};
// --- Banners ---
export const getAllBanners = async () => {
    return await prisma.banner.findMany({ orderBy: { order: 'asc' } });
};
export const createBanner = async (data) => {
    return await prisma.banner.create({ data });
};
export const updateBanner = async (id, data) => {
    return await prisma.banner.update({ where: { id }, data });
};
export const deleteBanner = async (id) => {
    return await prisma.banner.delete({ where: { id } });
};
// --- CMS Pages (static content) ---
export const getAllCmsPages = async () => {
    return prisma.cmsPage.findMany({ orderBy: [{ order: 'asc' }, { slug: 'asc' }] });
};
export const getCmsPageBySlug = async (slug) => {
    return prisma.cmsPage.findUnique({ where: { slug } });
};
export const updateCmsPageBySlug = async (slug, data) => {
    const existing = await prisma.cmsPage.findUnique({ where: { slug } });
    if (!existing) {
        throw new AppError(`CMS page "${slug}" not found`, 404);
    }
    return prisma.cmsPage.update({
        where: { slug },
        data: data,
    });
};
export const upsertCmsPages = async (pages) => {
    for (const page of pages) {
        await prisma.cmsPage.upsert({
            where: { slug: page.slug },
            update: {
                titleEn: page.titleEn,
                titleAr: page.titleAr,
                subtitleEn: page.subtitleEn ?? '',
                subtitleAr: page.subtitleAr ?? '',
                sectionsEn: page.sectionsEn ?? [],
                sectionsAr: page.sectionsAr ?? [],
                order: page.order ?? 0,
            },
            create: {
                slug: page.slug,
                titleEn: page.titleEn,
                titleAr: page.titleAr,
                subtitleEn: page.subtitleEn ?? '',
                subtitleAr: page.subtitleAr ?? '',
                sectionsEn: page.sectionsEn ?? [],
                sectionsAr: page.sectionsAr ?? [],
                order: page.order ?? 0,
                isPublished: true,
            },
        });
    }
};
//# sourceMappingURL=admin-cms.service.js.map