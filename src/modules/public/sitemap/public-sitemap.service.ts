import { prisma } from '../../../prisma.js';
import { APP_BRAND } from '../../../config/brand.config.js';
import { notDeleted } from '../../../utils/soft-delete.js';

const STATIC_PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/explore', priority: '0.8' },
  { path: '/courses', priority: '0.8' },
  { path: '/packages', priority: '0.7' },
  { path: '/about', priority: '0.5' },
  { path: '/contact', priority: '0.5' },
  { path: '/teach', priority: '0.5' },
  { path: '/blogs', priority: '0.6' },
  { path: '/faq', priority: '0.4' },
  { path: '/terms', priority: '0.3' },
  { path: '/privacy', priority: '0.3' },
  { path: '/refund-policy', priority: '0.3' },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(siteUrl: string, path: string, opts: { lastmod?: Date | null; priority?: string } = {}): string {
  const loc = escapeXml(`${siteUrl}${path}`);
  const lastmod = opts.lastmod ? `\n    <lastmod>${opts.lastmod.toISOString().slice(0, 10)}</lastmod>` : '';
  const priority = opts.priority ? `\n    <priority>${opts.priority}</priority>` : '';
  return `  <url>\n    <loc>${loc}</loc>${lastmod}${priority}\n  </url>`;
}

/**
 * Builds the public sitemap XML from published courses, packages, blog posts,
 * and the static marketing pages that make up the public SPA shell.
 */
export const buildSitemapXml = async (): Promise<string> => {
  const siteUrl = APP_BRAND.siteUrl.replace(/\/$/, '');

  const [courses, packages, posts] = await Promise.all([
    prisma.course.findMany({
      where: {
        ...notDeleted(),
        isActive: true,
        publishStatus: 'PUBLISHED',
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.coursePackage.findMany({
      where: { isActive: true, publishStatus: 'PUBLISHED' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const entries: string[] = [
    ...STATIC_PAGES.map((page) => urlEntry(siteUrl, page.path, { priority: page.priority })),
    ...courses.map((course) => urlEntry(siteUrl, `/courses/${course.id}`, { lastmod: course.updatedAt, priority: '0.7' })),
    ...packages.map((pkg) => urlEntry(siteUrl, `/packages/${pkg.id}`, { lastmod: pkg.updatedAt, priority: '0.6' })),
    ...posts.map((post) => urlEntry(siteUrl, `/blogs/${post.slug}`, { lastmod: post.updatedAt, priority: '0.5' })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
};
