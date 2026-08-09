/**
 * One-time data migration: cohorts → course purchases + course-scoped sessions.
 * Run BEFORE applying the new schema if upgrading an existing database:
 *   npx tsx prisma/migrations-data/cohort-to-course.ts
 * Then: npx prisma db push
 *
 * On a fresh DB, skip this and use `npm run db:seed` instead.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cohort → course migration…');

  const cohorts = await prisma.$queryRaw<
    Array<{
      id: string;
      courseId: string;
      type: string;
      instructorId: string;
    }>
  >`SELECT id, courseId, type, instructorId FROM cohorts`.catch(() => []);

  if (!cohorts.length) {
    console.log('No cohorts table or no rows — nothing to migrate.');
    return;
  }

  for (const cohort of cohorts) {
    const courseType = cohort.type === 'LIVE' ? 'HYBRID' : 'RECORDED';
    await prisma.$executeRaw`
      UPDATE courses SET type = ${courseType} WHERE id = ${cohort.courseId}
    `.catch(() => {});

    const enrollments = await prisma.$queryRaw<
      Array<{ studentId: string; joinedAt: Date; isCompleted: boolean; completedLessonsCount: number; progressPercentage: number }>
    >`SELECT studentId, joinedAt, isCompleted, completedLessonsCount, progressPercentage
      FROM cohort_enrollments WHERE cohortId = ${cohort.id}`.catch(() => []);

    for (const e of enrollments) {
      await prisma.$executeRaw`
        INSERT IGNORE INTO course_purchases (id, studentId, courseId, purchasedAt, isCompleted, completedLessonsCount, progressPercentage)
        VALUES (UUID(), ${e.studentId}, ${cohort.courseId}, ${e.joinedAt}, ${e.isCompleted}, ${e.completedLessonsCount}, ${e.progressPercentage})
      `.catch(() => {});
    }

    await prisma.$executeRaw`
      UPDATE live_sessions SET courseId = ${cohort.courseId} WHERE cohortId = ${cohort.id}
    `.catch(() => {});

    await prisma.$executeRaw`
      UPDATE lesson_progress lp
      INNER JOIN cohorts c ON lp.cohortId = c.id
      SET lp.courseId = c.courseId
      WHERE lp.cohortId = ${cohort.id}
    `.catch(() => {});

    await prisma.$executeRaw`
      UPDATE homeworks SET courseId = ${cohort.courseId} WHERE cohortId = ${cohort.id}
    `.catch(() => {});

    await prisma.$executeRaw`
      UPDATE payments SET courseId = ${cohort.courseId} WHERE cohortId = ${cohort.id}
    `.catch(() => {});
  }

  console.log(`Migrated ${cohorts.length} cohort(s). Apply schema with: npx prisma db push`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
