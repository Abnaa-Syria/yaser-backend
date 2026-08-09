import { prisma } from '../../../prisma.js';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Instructor performance dashboard (reviews and course ratings). */
export const getInstructorPerformanceDashboard = async (instructorId: string) => {
  const [instructorAgg, courseReviewAgg, irRatings, crReviews] = await prisma.$transaction([
    prisma.instructorReview.aggregate({
      where: { instructorId },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.courseReview.aggregate({
      where: { course: { instructorId } },
      _avg: { rating: true },
    }),
    prisma.instructorReview.findMany({
      where: { instructorId },
      select: { rating: true },
    }),
    prisma.courseReview.findMany({
      where: { course: { instructorId } },
      select: { rating: true, courseId: true },
    }),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of irRatings) {
    distribution[row.rating] = (distribution[row.rating] || 0) + 1;
  }
  for (const row of crReviews) {
    distribution[row.rating] = (distribution[row.rating] || 0) + 1;
  }

  const totalIr = instructorAgg._count.id;
  const totalCr = crReviews.length;
  const totalResponses = totalIr + totalCr;

  let weightedSum = 0;
  for (const row of irRatings) weightedSum += row.rating;
  for (const row of crReviews) weightedSum += row.rating;
  const overallRating = totalResponses ? round1(weightedSum / totalResponses) : 0;

  const courses = await prisma.course.findMany({
    where: { instructorId },
    select: { id: true, title: true },
  });
  const courseNameById = new Map(courses.map((c) => [c.id, c.title]));

  const courseStats = new Map<string, { sum: number; n: number }>();
  for (const row of crReviews) {
    const cur = courseStats.get(row.courseId) || { sum: 0, n: 0 };
    cur.sum += row.rating;
    cur.n += 1;
    courseStats.set(row.courseId, cur);
  }

  const questionBreakdown: { question: string; avgRating: number; responses: number }[] = [
    {
      question: 'Direct instructor reviews',
      avgRating: round1(instructorAgg._avg.rating || 0),
      responses: totalIr,
    },
    {
      question: 'Course reviews (all)',
      avgRating: round1(courseReviewAgg._avg.rating || 0),
      responses: totalCr,
    },
  ];

  for (const [cid, stats] of courseStats) {
    const name = courseNameById.get(cid) || 'Course';
    questionBreakdown.push({
      question: `Course: ${name}`,
      avgRating: stats.n ? round1(stats.sum / stats.n) : 0,
      responses: stats.n,
    });
  }

  return {
    instructorRating: round1(instructorAgg._avg.rating || 0),
    totalReviews: totalIr,
    averageCourseRating: round1(courseReviewAgg._avg.rating || 0),
    reviews: {
      overallRating,
      totalResponses,
      distribution,
      questionBreakdown,
    },
  };
};
