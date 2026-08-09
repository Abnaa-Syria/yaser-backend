import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

export const toggleReviewVisibility = async (reviewId: string) => {
  const review = await prisma.courseReview.findUnique({ where: { id: reviewId } });
  return await prisma.courseReview.update({
    where: { id: reviewId },
    data: { isVisible: !review?.isVisible }
  });
};

export const togglePackageVisibility = async (planId: string) => {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  return await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive: !plan?.isActive },
  });
};

export const upsertSection = async (key: string, content: any) => {
  return await prisma.homePageSection.upsert({
    where: { key },
    update: { content },
    create: { key, content }
  });
};

export const updateHeroSection = async (data: {
  headline: string | { en?: string; ar?: string };
  subheadline: string | { en?: string; ar?: string };
  isVisible?: boolean;
}) => {
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
  return section?.content || [];
};

export const getAllSections = async () => {
  return await prisma.homePageSection.findMany({ orderBy: { order: 'asc' } });
};

export const createSection = async (data: any) => {
  return await prisma.homePageSection.create({ data });
};

export const updateSectionById = async (id: string, data: any) => {
  return await prisma.homePageSection.update({ where: { id }, data });
};

export const deleteSection = async (id: string) => {
  await prisma.homePageSection.delete({ where: { id } });
  return { id, deleted: true };
};

// --- FAQ Granular Management ---
export const addFaqItem = async (data: any) => {
  const section = await prisma.homePageSection.findUnique({ where: { key: 'FAQ' } });
  const faqs = (section?.content as any[]) || [];
  const newItem = { id: crypto.randomUUID(), ...data, createdAt: new Date() };
  faqs.push(newItem);
  return await upsertSection('FAQ', faqs);
};

export const updateFaqItem = async (itemId: string, data: any) => {
  const section = await prisma.homePageSection.findUnique({ where: { key: 'FAQ' } });
  let faqs = (section?.content as any[]) || [];
  faqs = faqs.map(item => item.id === itemId ? { ...item, ...data } : item);
  return await upsertSection('FAQ', faqs);
};

export const deleteFaqItem = async (itemId: string) => {
  const section = await prisma.homePageSection.findUnique({ where: { key: 'FAQ' } });
  let faqs = (section?.content as any[]) || [];
  faqs = faqs.filter(item => item.id !== itemId);
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

export const toggleFeatureReview = async (id: string, isFeatured: boolean) => {
  return await prisma.courseReview.update({
    where: { id },
    data: { isFeatured }
  });
};

// --- Subscription plans (legacy "packages" CMS) ---
export const getAllPackages = async () => {
  return await prisma.subscriptionPlan.findMany({ orderBy: { durationMonths: 'asc' } });
};

export const updatePackageStatus = async (id: string, data: any) => {
  return await prisma.subscriptionPlan.update({
    where: { id },
    data,
  });
};

export const createPackage = async (data: any) => {
  return await prisma.subscriptionPlan.create({ data });
};

export const updatePackage = async (id: string, data: any) => {
  return await prisma.subscriptionPlan.update({
    where: { id },
    data,
  });
};

export const deletePackage = async (id: string) => {
  await prisma.subscriptionPlan.delete({ where: { id } });
  return { id, deleted: true };
};

// --- Posts ---
export const getAllPosts = async (query: any) => {
  const { page = 1, limit = 10, published } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (published !== undefined) where.published = published === 'true';

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

export const createPost = async (authorId: string, data: any) => {
  return await prisma.post.create({
    data: { ...data, authorId }
  });
};




export const updatePost = async (id: string, data: any) => {
  return await prisma.post.update({
    where: { id },
    data
  });
};




export const deletePost = async (id: string) => {
  return await prisma.post.delete({ where: { id } });
};




// --- Banners ---
export const getAllBanners = async () => {
  return await prisma.banner.findMany({ orderBy: { order: 'asc' } });
};




export const createBanner = async (data: any) => {
  return await prisma.banner.create({ data });
};




export const updateBanner = async (id: string, data: any) => {
  return await prisma.banner.update({ where: { id }, data });
};




export const deleteBanner = async (id: string) => {
  return await prisma.banner.delete({ where: { id } });
};

// --- CMS Pages (static content) ---
export const getAllCmsPages = async () => {
  return prisma.cmsPage.findMany({ orderBy: [{ order: 'asc' }, { slug: 'asc' }] });
};

export const getCmsPageBySlug = async (slug: string) => {
  return prisma.cmsPage.findUnique({ where: { slug } });
};

export const updateCmsPageBySlug = async (slug: string, data: Record<string, unknown>) => {
  const existing = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!existing) {
    throw new AppError(`CMS page "${slug}" not found`, 404);
  }
  return prisma.cmsPage.update({
    where: { slug },
    data: data as Parameters<typeof prisma.cmsPage.update>[0]['data'],
  });
};

export const upsertCmsPages = async (pages: Array<{
  slug: string;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  sectionsEn?: unknown;
  sectionsAr?: unknown;
  order?: number;
}>) => {
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
