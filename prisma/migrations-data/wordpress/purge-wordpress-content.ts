/**
 * Purge WordPress-imported content that is NOT user identity.
 *
 * Keeps:
 * - STUDENT users (and staff)
 * - LegacyExternalIdMap rows for entityType=User
 *
 * Deletes:
 * - WP-mapped courses (cascade units/sections/lessons/progress/purchases where FKs allow)
 * - Remaining WP maps for Course / Unit / Lesson / CoursePurchase
 *
 * Usage:
 *   npm run legacy:wp:purge-content:dry-run
 *   $env:ALLOW_LEGACY_CONTENT_PURGE="true"; npm run legacy:wp:purge-content:apply
 */
import 'dotenv/config';
import { prisma } from '../../../src/prisma.js';

type Args = { dryRun: boolean; apply: boolean };

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: true, apply: false };
  for (const arg of argv) {
    if (arg === '--apply') {
      args.apply = true;
      args.dryRun = false;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.apply && process.env.ALLOW_LEGACY_CONTENT_PURGE !== 'true') {
    throw new Error(
      'Refusing apply. Set ALLOW_LEGACY_CONTENT_PURGE=true to delete WordPress-imported courses/enrollments.'
    );
  }

  const courseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', entityType: 'Course' },
    select: { id: true, targetId: true, legacyId: true },
  });
  const purchaseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', entityType: 'CoursePurchase' },
    select: { id: true, targetId: true },
  });
  const unitMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', entityType: 'Unit' },
    select: { id: true },
  });
  const lessonMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', entityType: 'Lesson' },
    select: { id: true },
  });
  const userMapCount = await prisma.legacyExternalIdMap.count({
    where: { source: 'WORDPRESS', entityType: 'User' },
  });

  const courseIds = [...new Set(courseMaps.map((m) => m.targetId))];
  const purchaseIds = [...new Set(purchaseMaps.map((m) => m.targetId))];

  const existingCourses = courseIds.length
    ? await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } })
    : [];
  const existingPurchases = purchaseIds.length
    ? await prisma.coursePurchase.count({ where: { id: { in: purchaseIds } } })
    : 0;
  const progressOnCourses = courseIds.length
    ? await prisma.lessonProgress.count({ where: { courseId: { in: courseIds } } })
    : 0;

  const summary = {
    dryRun: args.dryRun,
    keepUserMaps: userMapCount,
    wouldDeleteCourseMaps: courseMaps.length,
    wouldDeleteUnitMaps: unitMaps.length,
    wouldDeleteLessonMaps: lessonMaps.length,
    wouldDeletePurchaseMaps: purchaseMaps.length,
    coursesFound: existingCourses.length,
    purchasesFound: existingPurchases,
    progressOnWpCourses: progressOnCourses,
    courseTitlesSample: existingCourses.slice(0, 10).map((c) => c.title),
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ ...summary, note: 'Dry-run only. No deletes performed.' }, null, 2));
    return;
  }

  const deleted = {
    purchasesByMap: 0,
    courses: 0,
    maps: 0,
  };

  await prisma.$transaction(
    async (tx) => {
      if (purchaseIds.length) {
        const result = await tx.coursePurchase.deleteMany({ where: { id: { in: purchaseIds } } });
        deleted.purchasesByMap = result.count;
      }

      if (courseIds.length) {
        const result = await tx.course.deleteMany({ where: { id: { in: courseIds } } });
        deleted.courses = result.count;
      }

      const mapResult = await tx.legacyExternalIdMap.deleteMany({
        where: {
          source: 'WORDPRESS',
          entityType: { in: ['Course', 'Unit', 'Lesson', 'CoursePurchase'] },
        },
      });
      deleted.maps = mapResult.count;
    },
    { timeout: 120_000 }
  );

  console.log(
    JSON.stringify(
      {
        ...summary,
        deleted,
        note: 'Purged WordPress courses/enrollments/maps. User identity maps kept.',
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
