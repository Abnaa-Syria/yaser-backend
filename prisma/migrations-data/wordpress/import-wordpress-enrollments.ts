/**
 * WordPress → Yaser: enrollments (CoursePurchase) + lesson progress.
 *
 * Requires prior student + course imports (LegacyExternalIdMap for User/Course/Lesson).
 *
 * Usage:
 *   npm run legacy:wp:enrollments:dry-run
 *   $env:ALLOW_LEGACY_ENROLLMENT_IMPORT="true"; npm run legacy:wp:enrollments:apply
 */
import 'dotenv/config';
import path from 'path';
import { prisma } from '../../../src/prisma.js';
import { buildEnrollmentImportPlan, unixToDate } from './parse-enrollments.js';

type Args = {
  dryRun: boolean;
  apply: boolean;
  sourceSql: string;
  limit?: number;
  skipProgress?: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: true,
    apply: false,
    sourceSql: path.resolve(process.cwd(), '..', 'u450369734_GbsWr (3).sql'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      args.apply = true;
      args.dryRun = false;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
    }
    if (arg === '--source-sql') {
      args.sourceSql = path.resolve(argv[i + 1]);
      i += 1;
    }
    if (arg === '--limit') {
      args.limit = Math.max(1, Number(argv[i + 1]) || 0) || undefined;
      i += 1;
    }
    if (arg === '--skip-progress') args.skipProgress = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = buildEnrollmentImportPlan(args.sourceSql);
  const rows = args.limit ? plan.userCourses.slice(0, args.limit) : plan.userCourses;

  if (args.apply && process.env.ALLOW_LEGACY_ENROLLMENT_IMPORT !== 'true') {
    throw new Error(
      'Refusing apply. Set ALLOW_LEGACY_ENROLLMENT_IMPORT=true to write enrollments from the WordPress dump.'
    );
  }

  const userMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_users', entityType: 'User' },
    select: { legacyId: true, targetId: true },
  });
  const courseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_posts', entityType: 'Course' },
    select: { legacyId: true, targetId: true },
  });
  const lessonMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_posts', entityType: 'Lesson' },
    select: { legacyId: true, targetId: true },
  });
  const purchaseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_stm_lms_user_courses', entityType: 'CoursePurchase' },
    select: { id: true, legacyId: true, targetId: true },
  });

  const userByLegacy = new Map(userMaps.map((m) => [m.legacyId, m.targetId]));
  const courseByLegacy = new Map(courseMaps.map((m) => [m.legacyId, m.targetId]));
  const lessonByLegacy = new Map(lessonMaps.map((m) => [m.legacyId, m.targetId]));
  const purchaseByLegacy = new Map(purchaseMaps.map((m) => [m.legacyId, m]));

  let wouldCreate = 0;
  let wouldSkipNoUser = 0;
  let wouldSkipNoCourse = 0;
  let wouldSkipExisting = 0;
  let created = 0;
  let progressCreated = 0;
  let progressSkipped = 0;

  const run = await prisma.legacyImportRun.create({
    data: {
      source: 'WORDPRESS',
      mode: args.dryRun ? 'DRY_RUN_ENROLLMENTS' : 'APPLY_ENROLLMENTS',
      status: args.dryRun ? 'DRY_RUN' : 'RUNNING',
      sourceDescription: plan.filePath,
      options: {
        enrollments: true,
        limit: args.limit ?? null,
        skipProgress: Boolean(args.skipProgress),
        statusBreakdown: plan.statusBreakdown,
        duplicateUserCourseRows: plan.duplicateUserCourseRows,
      },
      summary: {
        userCourses: plan.userCourses.length,
        userLessons: plan.userLessons.length,
        mappedUsers: userMaps.length,
        mappedCourses: courseMaps.length,
        mappedLessons: lessonMaps.length,
      },
    },
  });

  try {
    for (const row of rows) {
      if (purchaseByLegacy.has(row.legacyId)) {
        wouldSkipExisting += 1;
        continue;
      }
      const studentId = userByLegacy.get(row.userLegacyId);
      const courseId = courseByLegacy.get(row.courseLegacyId);
      if (!studentId) {
        wouldSkipNoUser += 1;
        continue;
      }
      if (!courseId) {
        wouldSkipNoCourse += 1;
        continue;
      }

      // Also skip if unique (studentId, courseId) already exists without map
      const existingPurchase = await prisma.coursePurchase.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
        select: { id: true },
      });
      if (existingPurchase) {
        wouldSkipExisting += 1;
        if (!args.dryRun) {
          await prisma.legacyExternalIdMap.upsert({
            where: {
              source_sourceTable_legacyId_entityType: {
                source: 'WORDPRESS',
                sourceTable: 'wp_stm_lms_user_courses',
                legacyId: row.legacyId,
                entityType: 'CoursePurchase',
              },
            },
            create: {
              runId: run.id,
              source: 'WORDPRESS',
              sourceTable: 'wp_stm_lms_user_courses',
              legacyId: row.legacyId,
              entityType: 'CoursePurchase',
              targetId: existingPurchase.id,
              metadata: { linkedExisting: true },
            },
            update: { runId: run.id },
          });
          purchaseByLegacy.set(row.legacyId, {
            id: 'linked',
            legacyId: row.legacyId,
            targetId: existingPurchase.id,
          });
        }
        continue;
      }

      wouldCreate += 1;
      if (args.dryRun) continue;

      const purchasedAt = unixToDate(row.startTimeUnix) || new Date();
      const expiresAt = unixToDate(row.endTimeUnix);
      // MasterStudy end_time often equals completion time, not access expiry.
      // Prefer open-ended access unless end is clearly far in the future (> start + 30d).
      const treatAsExpiry =
        expiresAt && row.startTimeUnix > 0 && row.endTimeUnix - row.startTimeUnix > 60 * 60 * 24 * 30;

      const purchase = await prisma.coursePurchase.create({
        data: {
          studentId,
          courseId,
          purchasedAt,
          accessStartsAt: purchasedAt,
          activatedAt: purchasedAt,
          expiresAt: treatAsExpiry ? expiresAt : null,
          progressPercentage: Math.min(100, Math.max(0, row.progressPercent)),
          isCompleted: row.progressPercent >= 100,
        },
      });

      await prisma.legacyExternalIdMap.create({
        data: {
          runId: run.id,
          source: 'WORDPRESS',
          sourceTable: 'wp_stm_lms_user_courses',
          legacyId: row.legacyId,
          entityType: 'CoursePurchase',
          targetId: purchase.id,
          metadata: {
            userLegacyId: row.userLegacyId,
            courseLegacyId: row.courseLegacyId,
            wpStatus: row.status,
          },
        },
      });
      purchaseByLegacy.set(row.legacyId, {
        id: 'new',
        legacyId: row.legacyId,
        targetId: purchase.id,
      });
      created += 1;
    }

    if (!args.skipProgress && !args.dryRun) {
      for (const row of plan.userLessons) {
        const studentId = userByLegacy.get(row.userLegacyId);
        const courseId = courseByLegacy.get(row.courseLegacyId);
        const lessonId = lessonByLegacy.get(row.lessonLegacyId);
        if (!studentId || !courseId || !lessonId) {
          progressSkipped += 1;
          continue;
        }
        const lastAccessedAt = unixToDate(row.endTimeUnix) || unixToDate(row.startTimeUnix) || new Date();
        try {
          await prisma.lessonProgress.upsert({
            where: {
              studentId_lessonId_courseId: { studentId, lessonId, courseId },
            },
            create: {
              studentId,
              lessonId,
              courseId,
              isCompleted: true,
              completedAt: lastAccessedAt,
              lastAccessedAt,
              watchPercentage: 100,
            },
            update: {
              isCompleted: true,
              completedAt: lastAccessedAt,
              lastAccessedAt,
              watchPercentage: 100,
            },
          });
          progressCreated += 1;
        } catch {
          progressSkipped += 1;
        }
      }
    } else if (args.dryRun && !args.skipProgress) {
      for (const row of plan.userLessons) {
        if (
          userByLegacy.has(row.userLegacyId) &&
          courseByLegacy.has(row.courseLegacyId) &&
          lessonByLegacy.has(row.lessonLegacyId)
        ) {
          progressCreated += 1;
        } else {
          progressSkipped += 1;
        }
      }
    }

    const summary = {
      wouldCreate,
      wouldSkipNoUser,
      wouldSkipNoCourse,
      wouldSkipExisting,
      created,
      progressWouldOrCreated: progressCreated,
      progressSkipped,
      statusBreakdown: plan.statusBreakdown,
      mappedUsers: userMaps.length,
      mappedCourses: courseMaps.length,
    };

    await prisma.legacyImportRun.update({
      where: { id: run.id },
      data: {
        status: args.dryRun ? 'DRY_RUN' : 'COMPLETED',
        finishedAt: new Date(),
        summary,
        usersImported: created,
      },
    });

    console.log(
      JSON.stringify(
        {
          mode: args.dryRun ? 'DRY_RUN' : 'APPLY',
          runId: run.id,
          ...summary,
        },
        null,
        2
      )
    );
  } catch (error) {
    await prisma.legacyImportRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        errorLog: { message: error instanceof Error ? error.message : String(error) },
      },
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
