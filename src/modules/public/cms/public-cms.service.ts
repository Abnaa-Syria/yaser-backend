import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

const publicPostAuthorSelect = { fullName: true as const };

const publicPostListSelect = {
  id: true,
  title: true,
  titleAr: true,
  slug: true,
  thumbnail: true,
  category: true,
  createdAt: true,
  updatedAt: true,
  content: true,
  contentAr: true,
  author: { select: publicPostAuthorSelect },
} as const;

function excerptFromContent(content: unknown, maxLen: number): string | null {
  if (!content || typeof content !== 'object') return null;
  const c = content as Record<string, unknown>;
  if (c.format === 'markdown' && typeof c.body === 'string') {
    const s = c.body.trim().replace(/\s+/g, ' ');
    if (!s) return null;
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  }
  if (Array.isArray(c.bullets) && c.bullets.length > 0) {
    const parts: string[] = [];
    for (const item of c.bullets) {
      if (!item || typeof item !== 'object') continue;
      const b = item as Record<string, unknown>;
      if (typeof b.title === 'string') parts.push(b.title);
      if (typeof b.body === 'string') parts.push(b.body);
    }
    const s = parts.join(' · ').trim();
    if (!s) return null;
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  }
  return null;
}

export const getPublicPosts = async (query: Record<string, unknown>) => {
  const { page = '1', limit = '12', search, category } = query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
  const skip = (pageNum - 1) * limitNum;

  const where: {
    published: true;
    category?: string;
    OR?: { title: { contains: string } }[];
  } = { published: true };

  if (category && String(category).trim() && String(category).toUpperCase() !== 'ALL') {
    where.category = String(category).trim();
  }

  if (search && String(search).trim()) {
    const q = String(search).trim();
    where.OR = [{ title: { contains: q } }];
  }

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: publicPostListSelect,
    }),
    prisma.post.count({ where }),
  ]);

  const posts = rows.map(({ content, ...rest }) => ({
    ...rest,
    excerpt: excerptFromContent(content, 200),
  }));

  return {
    posts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 0,
    },
  };
};

export const getPublicPostBySlug = async (slug: string) => {
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      titleAr: true,
      slug: true,
      thumbnail: true,
      category: true,
      content: true,
      contentAr: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      author: { select: publicPostAuthorSelect },
    },
  });
  if (!post) throw new AppError('Post not found.', 404);
  return post;
};

export const getLandingPageData = async () => {
  const [sections, featuredReviews, activePackages, studentCount, courseCount, instructorCount] = await Promise.all([
    // 1. Get all visible dynamic sections (FAQ, About, etc)
    prisma.homePageSection.findMany({ 
      where: { isVisible: true }, 
      orderBy: { order: 'asc' } 
    }),
    
    // 2. Get high-rated visible reviews for social proof
    prisma.courseReview.findMany({ 
      where: { isVisible: true, rating: { gte: 4 } }, 
      take: 6, 
      orderBy: { createdAt: 'desc' },
      include: { 
        student: { select: { fullName: true, avatar: true } }, 
        course: { select: { title: true } } 
      }
    }),
    
    // 3. Get active subscription plans
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { durationMonths: 'asc' },
    }),

    // 4. Counts for statistics
    prisma.user.count({
      where: { role: { name: 'STUDENT' }, deletedAt: null },
    }),
    prisma.course.count({
      where: { status: 'APPROVED', deletedAt: null },
    }),
    prisma.user.count({
      where: { role: { name: 'INSTRUCTOR' }, deletedAt: null },
    }),
  ]);

  const stats = {
    students: studentCount,
    courses: courseCount,
    instructors: instructorCount,
    // Add offset for premium feel
    studentsFormatted: `${studentCount + 1490}`,
  };

  return { sections, featuredReviews, activePackages, stats };
};

export const getPublicBanners = async () => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      imageUrl: true,
      link: true,
      order: true,
    },
  });

  return { banners };
};

export const getPublicCmsPageBySlug = async (slug: string) => {
  const page = await prisma.cmsPage.findFirst({
    where: { slug, isPublished: true },
  });
  if (!page) throw new AppError('Page not found.', 404);
  return page;
};

export const getPublicCmsPagesIndex = async () => {
  return prisma.cmsPage.findMany({
    where: { isPublished: true },
    orderBy: [{ order: 'asc' }, { slug: 'asc' }],
    select: {
      slug: true,
      titleEn: true,
      titleAr: true,
      subtitleEn: true,
      subtitleAr: true,
      order: true,
      updatedAt: true,
    },
  });
};
