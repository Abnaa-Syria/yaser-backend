import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';
import { buildStudentPerformanceBundle } from '../../shared/student-performance-aggregate.js';
/**

 * Admin read-only academic analytics for a single student.

 */
export const getStudentPerformanceForAdmin = async (studentId) => {
    const user = await prisma.user.findFirst({
        where: { id: studentId, ...userHasRoleName('STUDENT') },
        select: { id: true, fullName: true, email: true },
    });
    if (!user)
        throw new AppError('Student not found.', 404);
    const enrollments = await prisma.coursePurchase.findMany({
        where: { studentId },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                },
            },
        },
        orderBy: { purchasedAt: 'desc' },
    });
    const courseIds = enrollments.map((e) => e.courseId);
    const [paymentsSum, examSubs, lessonProgressRows] = await Promise.all([
        prisma.payment.aggregate({
            where: { studentId, status: 'PAID' },
            _sum: { amount: true },
        }),
        prisma.examSubmission.findMany({
            where: { studentId, submittedAt: { not: null } },
            include: {
                exam: { select: { id: true, title: true, totalPoints: true, passingScore: true } },
            },
            orderBy: { submittedAt: 'desc' },
        }),
        courseIds.length
            ? prisma.lessonProgress.findMany({
                where: { studentId, courseId: { in: courseIds } },
                select: { isCompleted: true, courseId: true, watchPercentage: true },
            })
            : Promise.resolve([]),
    ]);
    const totalSpent = Number(paymentsSum._sum.amount ?? 0);
    let totalLessonsInCourses = 0;
    for (const cid of courseIds) {
        totalLessonsInCourses += await prisma.lesson.count({
            where: { section: { unit: { courseId: cid } } },
        });
    }
    const mappedEnrollments = enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        progressPercentage: e.progressPercentage,
        isCompleted: e.isCompleted,
        course: e.course,
    }));
    const bundle = buildStudentPerformanceBundle({
        enrollments: mappedEnrollments,
        examSubs,
        lessonProgressRows,
        totalSpent,
        totalLessonsInEnrolledCourses: totalLessonsInCourses,
    });
    return {
        student: user,
        ...bundle,
        examSubmissions: examSubs,
    };
};
//# sourceMappingURL=admin-student.service.js.map