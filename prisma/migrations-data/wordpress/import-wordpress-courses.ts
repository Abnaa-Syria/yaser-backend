/**
 * WordPress → Yaser: courses + curriculum import.
 *
 * Mapping:
 * - stm-courses → Course
 * - curriculum_sections → Unit (organ system)
 * - synthetic Section "Lectures" per Unit
 * - stm-lessons materials → Lesson (quizzes deferred)
 *
 * Usage:
 *   npm run legacy:wp:courses:dry-run
 *   $env:ALLOW_LEGACY_COURSE_IMPORT="true"; npm run legacy:wp:courses:apply
 *   $env:ALLOW_LEGACY_COURSE_IMPORT="true"; npm run legacy:wp:courses:resync
 */
import 'dotenv/config';
import path from 'path';
import { prisma } from '../../../src/prisma.js';
import { buildCourseImportPlan, wpStatusToApp } from './parse-courses.js';
import { slugify } from './sql-parse.js';

type Args = {
  dryRun: boolean;
  apply: boolean;
  resync: boolean;
  sourceSql: string;
  limit?: number;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: true,
    apply: false,
    resync: false,
    sourceSql: path.resolve(process.cwd(), '..', 'u450369734_GbsWr (3).sql'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      args.apply = true;
      args.dryRun = false;
    }
    if (arg === '--resync') {
      args.apply = true;
      args.resync = true;
      args.dryRun = false;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
      args.resync = false;
    }
    if (arg === '--source-sql') {
      args.sourceSql = path.resolve(argv[i + 1]);
      i += 1;
    }
    if (arg === '--limit') {
      args.limit = Math.max(1, Number(argv[i + 1]) || 0) || undefined;
      i += 1;
    }
  }
  return args;
}

async function ensureUniqueCourseSlug(base: string, excludeId?: string) {
  let candidate = base.slice(0, 80) || 'course';
  let n = 0;
  while (true) {
    const existing = await prisma.course.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${base.slice(0, 70)}-${n}`;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resync = args.resync || args.apply;
  const plan = buildCourseImportPlan(args.sourceSql);
  const courses = args.limit ? plan.courses.slice(0, args.limit) : plan.courses;

  if ((args.apply || args.resync) && process.env.ALLOW_LEGACY_COURSE_IMPORT !== 'true') {
    throw new Error(
      'Refusing apply/resync. Set ALLOW_LEGACY_COURSE_IMPORT=true to write courses from the WordPress dump.'
    );
  }

  const owner =
    (await prisma.user.findFirst({
      where: { email: 'dr.yaser@yaserusmle.com', deletedAt: null },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({
      where: { role: { name: 'SUPER_ADMIN' }, deletedAt: null },
      select: { id: true },
    }));

  if (!args.dryRun && !owner) {
    throw new Error('No SUPER_ADMIN / platform owner found to assign as course instructor.');
  }

  const existingCourseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_posts', entityType: 'Course' },
    select: { id: true, legacyId: true, targetId: true },
  });
  const courseMapByLegacy = new Map(existingCourseMaps.map((m) => [m.legacyId, m]));

  const existingUnitMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_stm_lms_curriculum_sections', entityType: 'Unit' },
    select: { id: true, legacyId: true, targetId: true },
  });
  const unitMapByLegacy = new Map(existingUnitMaps.map((m) => [m.legacyId, m]));

  const existingLessonMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_posts', entityType: 'Lesson' },
    select: { id: true, legacyId: true, targetId: true },
  });
  const lessonMapByLegacy = new Map(existingLessonMaps.map((m) => [m.legacyId, m]));

  let wouldCreateCourses = 0;
  let wouldUpdateCourses = 0;
  let wouldCreateUnits = 0;
  let wouldCreateLessons = 0;
  let createdCourses = 0;
  let updatedCourses = 0;
  let createdUnits = 0;
  let createdLessons = 0;
  let skippedLessonsMissing = 0;

  const run = await prisma.legacyImportRun.create({
    data: {
      source: 'WORDPRESS',
      mode: args.dryRun ? 'DRY_RUN_COURSES' : resync ? 'RESYNC_COURSES' : 'APPLY_COURSES',
      status: args.dryRun ? 'DRY_RUN' : 'RUNNING',
      sourceDescription: plan.filePath,
      options: {
        coursesOnly: true,
        resync,
        limit: args.limit ?? null,
        quizMaterialsSkipped: plan.quizMaterialsSkipped,
        orphanMaterials: plan.orphanMaterials,
        coursesWithoutCurriculum: plan.coursesWithoutCurriculum,
      },
      summary: {
        coursesInDump: plan.courses.length,
        sectionsInDump: plan.sections.length,
        lessonMaterials: plan.lessonMaterials.length,
        lessonsParsed: plan.lessonsById.size,
      },
    },
  });

  const selectedCourseIds = new Set(courses.map((c) => c.legacyId));
  const sectionsForCourses = plan.sections
    .filter((s) => selectedCourseIds.has(s.courseLegacyId))
    .sort((a, b) => a.order - b.order || Number(a.legacyId) - Number(b.legacyId));
  const sectionById = new Map(sectionsForCourses.map((s) => [s.legacyId, s]));
  const materialsForCourses = plan.lessonMaterials
    .filter((m) => sectionById.has(m.sectionLegacyId))
    .sort((a, b) => a.order - b.order || Number(a.legacyId) - Number(b.legacyId));

  try {
    for (const course of courses) {
      const mapped = courseMapByLegacy.get(course.legacyId);
      const publishStatus = wpStatusToApp(course.status);
      const contentStatus = publishStatus === 'PUBLISHED' ? 'APPROVED' : 'DRAFT';

      if (mapped) {
        wouldUpdateCourses += 1;
      } else {
        wouldCreateCourses += 1;
      }

      if (args.dryRun) continue;

      let courseId = mapped?.targetId;
      if (mapped && resync) {
        const slug = await ensureUniqueCourseSlug(course.slug, mapped.targetId);
        await prisma.course.update({
          where: { id: mapped.targetId },
          data: {
            title: course.title,
            slug,
            shortDescription: course.shortDescription || null,
            description: sanitizeHtmlKeepBasic(course.contentHtml),
            publishStatus,
            status: contentStatus,
            isActive: publishStatus === 'PUBLISHED',
            instructorId: owner!.id,
            deletedAt: null,
          },
        });
        await prisma.legacyExternalIdMap.update({
          where: { id: mapped.id },
          data: { runId: run.id, metadata: { slug, refreshedAt: new Date().toISOString() } },
        });
        updatedCourses += 1;
        courseId = mapped.targetId;
      } else if (!mapped) {
        const slug = await ensureUniqueCourseSlug(course.slug);
        const created = await prisma.course.create({
          data: {
            title: course.title,
            slug,
            shortDescription: course.shortDescription || null,
            description: sanitizeHtmlKeepBasic(course.contentHtml),
            publishStatus,
            status: contentStatus,
            isActive: publishStatus === 'PUBLISHED',
            instructorId: owner!.id,
            type: 'RECORDED',
            price: 0,
            isLifetimePurchasable: true,
          },
        });
        await prisma.legacyExternalIdMap.create({
          data: {
            runId: run.id,
            source: 'WORDPRESS',
            sourceTable: 'wp_posts',
            legacyId: course.legacyId,
            entityType: 'Course',
            targetId: created.id,
            metadata: { slug, wpStatus: course.status },
          },
        });
        courseMapByLegacy.set(course.legacyId, {
          id: 'new',
          legacyId: course.legacyId,
          targetId: created.id,
        });
        createdCourses += 1;
        courseId = created.id;
      }
    }

    // Units + lessons
    for (const section of sectionsForCourses) {
      const courseMap = courseMapByLegacy.get(section.courseLegacyId);
      // On dry-run, course maps are not written yet — still count units for selected courses.
      if (!courseMap && !selectedCourseIds.has(section.courseLegacyId)) continue;

      const existingUnit = unitMapByLegacy.get(section.legacyId);
      if (existingUnit) {
        if (!args.dryRun && resync) {
          await prisma.unit.update({
            where: { id: existingUnit.targetId },
            data: {
              title: section.title,
              order: section.order,
              status: 'PUBLISHED',
            },
          });
        }
      } else {
        wouldCreateUnits += 1;
        if (args.dryRun || !courseMap) continue;

        const unitSlug = slugify(section.title, `unit-${section.legacyId}`);
        const unit = await prisma.unit.create({
          data: {
            title: section.title,
            slug: unitSlug,
            order: section.order,
            status: 'PUBLISHED',
            courseId: courseMap.targetId,
          },
        });
        const sectionRow = await prisma.section.create({
          data: {
            title: 'Lectures',
            order: 1,
            unitId: unit.id,
          },
        });
        await prisma.legacyExternalIdMap.create({
          data: {
            runId: run.id,
            source: 'WORDPRESS',
            sourceTable: 'wp_stm_lms_curriculum_sections',
            legacyId: section.legacyId,
            entityType: 'Unit',
            targetId: unit.id,
            metadata: { sectionId: sectionRow.id, courseLegacyId: section.courseLegacyId },
          },
        });
        unitMapByLegacy.set(section.legacyId, {
          id: 'new',
          legacyId: section.legacyId,
          targetId: unit.id,
        });
        createdUnits += 1;
      }
    }

    // Resolve sectionId (app) for each unit via map metadata or first section
    const unitSectionId = new Map<string, string>();
    if (!args.dryRun) {
      for (const [legacySectionId, unitMap] of unitMapByLegacy) {
        if (!sectionById.has(legacySectionId)) continue;
        const meta = await prisma.legacyExternalIdMap.findFirst({
          where: {
            source: 'WORDPRESS',
            sourceTable: 'wp_stm_lms_curriculum_sections',
            entityType: 'Unit',
            legacyId: legacySectionId,
          },
          select: { metadata: true, targetId: true },
        });
        const metaSectionId =
          meta?.metadata && typeof meta.metadata === 'object' && meta.metadata !== null
            ? (meta.metadata as { sectionId?: string }).sectionId
            : undefined;
        if (metaSectionId) {
          unitSectionId.set(legacySectionId, metaSectionId);
          continue;
        }
        const firstSection = await prisma.section.findFirst({
          where: { unitId: unitMap.targetId, deletedAt: null },
          orderBy: { order: 'asc' },
          select: { id: true },
        });
        if (firstSection) unitSectionId.set(legacySectionId, firstSection.id);
      }
    }

    for (const material of materialsForCourses) {
      const lesson = plan.lessonsById.get(material.postLegacyId);
      if (!lesson) {
        skippedLessonsMissing += 1;
        continue;
      }
      const existingLesson = lessonMapByLegacy.get(lesson.legacyId);
      if (existingLesson) {
        if (!args.dryRun && resync) {
          const sectionId = unitSectionId.get(material.sectionLegacyId);
          await prisma.lesson.update({
            where: { id: existingLesson.targetId },
            data: {
              title: lesson.title,
              order: material.order,
              content: sanitizeHtmlKeepBasic(lesson.contentHtml),
              vdoCipherVideoId: lesson.vdoCipherVideoId,
              videoUrl: lesson.vdoCipherVideoId ? null : lesson.videoUrl,
              status: wpStatusToApp(lesson.status),
              ...(sectionId ? { sectionId } : {}),
            },
          });
        }
        continue;
      }

      wouldCreateLessons += 1;
      if (args.dryRun) continue;

      const sectionId = unitSectionId.get(material.sectionLegacyId);
      if (!sectionId) {
        skippedLessonsMissing += 1;
        continue;
      }

      const lessonSlug = slugify(lesson.slug || lesson.title, `lesson-${lesson.legacyId}`);
      const created = await prisma.lesson.create({
        data: {
          title: lesson.title,
          slug: lessonSlug,
          order: material.order,
          content: sanitizeHtmlKeepBasic(lesson.contentHtml),
          vdoCipherVideoId: lesson.vdoCipherVideoId,
          videoUrl: lesson.vdoCipherVideoId ? null : lesson.videoUrl,
          status: wpStatusToApp(lesson.status),
          sectionId,
          isPreview: false,
          isLocked: false,
        },
      });
      await prisma.legacyExternalIdMap.create({
        data: {
          runId: run.id,
          source: 'WORDPRESS',
          sourceTable: 'wp_posts',
          legacyId: lesson.legacyId,
          entityType: 'Lesson',
          targetId: created.id,
          metadata: {
            materialId: material.legacyId,
            sectionLegacyId: material.sectionLegacyId,
            durationLabel: lesson.durationLabel,
          },
        },
      });
      lessonMapByLegacy.set(lesson.legacyId, {
        id: 'new',
        legacyId: lesson.legacyId,
        targetId: created.id,
      });
      createdLessons += 1;
    }

    const summary = {
      wouldCreateCourses,
      wouldUpdateCourses,
      wouldCreateUnits,
      wouldCreateLessons,
      createdCourses,
      updatedCourses,
      createdUnits,
      createdLessons,
      skippedLessonsMissing,
      quizMaterialsSkipped: plan.quizMaterialsSkipped,
      coursesWithoutCurriculum: plan.coursesWithoutCurriculum.length,
      sampleCourses: courses.slice(0, 5).map((c) => ({
        legacyId: c.legacyId,
        title: c.title,
        status: c.status,
        sections: plan.sectionCountByCourse[c.legacyId] || 0,
        lessons: plan.lessonCountByCourse[c.legacyId] || 0,
      })),
    };

    await prisma.legacyImportRun.update({
      where: { id: run.id },
      data: {
        status: args.dryRun ? 'DRY_RUN' : 'COMPLETED',
        finishedAt: new Date(),
        summary,
        usersImported: createdCourses + createdUnits + createdLessons,
      },
    });

    console.log(
      JSON.stringify(
        {
          mode: args.dryRun ? 'DRY_RUN' : resync ? 'RESYNC' : 'APPLY',
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

/** Keep basic formatting; strip scripts/iframes. Media URLs left as-is for later rewrite. */
function sanitizeHtmlKeepBasic(html: string) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .slice(0, 200000);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
