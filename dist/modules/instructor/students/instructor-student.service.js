import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';
import { buildStudentPerformanceBundle } from '../../shared/student-performance-aggregate.js';
import { getStudentAttendanceReport } from '../../shared/attendance-read.service.js';
export const listInstructorStudents = async (instructorId, query) => {
    const pageNum = Number(query.page) || 1;
    const limitNum = Math.min(Number(query.limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const and = [{ course: { instructorId } }];
    if (query.courseId)
        and.push({ courseId: query.courseId });
    if (query.search?.trim()) {
        const q = query.search.trim();
        and.push({
            OR: [
                { student: { fullName: { contains: q } } },
                { student: { email: { contains: q } } },
            ],
        });
    }
    const where = { AND: and };
    const [purchases, total] = await Promise.all([
        prisma.coursePurchase.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { purchasedAt: 'desc' },
            include: {
                student: {
                    select: { id: true, fullName: true, email: true, avatar: true },
                },
                course: {
                    select: { id: true, title: true, type: true },
                },
            },
        }),
        prisma.coursePurchase.count({ where }),
    ]);
    return {
        students: purchases.map((p) => ({
            enrollmentId: p.id,
            studentId: p.studentId,
            courseId: p.courseId,
            courseTitle: p.course.title,
            courseType: p.course.type,
            purchasedAt: p.purchasedAt,
            progressPercentage: p.progressPercentage,
            isCompleted: p.isCompleted,
            student: p.student,
        })),
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        },
    };
};
/**
 * Instructor-scoped analytics: only courses taught by this instructor.
 */
export const getStudentPerformanceForInstructor = async (instructorId, studentId) => {
    const user = await prisma.user.findFirst({
        where: { id: studentId, ...userHasRoleName('STUDENT') },
        select: { id: true, fullName: true, email: true, lastLoginAt: true, isActive: true, createdAt: true, academicLevel: true },
    });
    if (!user)
        throw new AppError('Student not found.', 404);
    const instructorCourseIds = (await prisma.course.findMany({
        where: { instructorId },
        select: { id: true },
    })).map((c) => c.id);
    if (!instructorCourseIds.length) {
        throw new AppError('You do not have access to this student.', 403);
    }
    const enrollments = await prisma.coursePurchase.findMany({
        where: { studentId, courseId: { in: instructorCourseIds } },
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
    if (!enrollments.length) {
        throw new AppError('You do not have access to this student.', 403);
    }
    const courseIds = enrollments.map((e) => e.courseId);
    const courseIdSet = new Set(courseIds);
    const examInScopedCourses = (exam) => {
        if (exam.courseId && courseIdSet.has(exam.courseId))
            return true;
        if (exam.unit?.courseId && courseIdSet.has(exam.unit.courseId))
            return true;
        const lessonCourseId = exam.lesson?.section?.unit?.courseId;
        if (lessonCourseId && courseIdSet.has(lessonCourseId))
            return true;
        return false;
    };
    const [examSubsRaw, hwSubs, homeworksAssigned, lessonProgressRows, completedSessionsCount] = await Promise.all([
        prisma.examSubmission.findMany({
            where: {
                studentId,
                submittedAt: { not: null },
                exam: {
                    OR: [
                        { courseId: { in: courseIds } },
                        { unit: { courseId: { in: courseIds } } },
                        { lesson: { section: { unit: { courseId: { in: courseIds } } } } },
                    ],
                },
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        passingScore: true,
                        courseId: true,
                        unit: { select: { courseId: true } },
                        lesson: { select: { section: { select: { unit: { select: { courseId: true } } } } } },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        }),
        prisma.homeworkSubmission.findMany({
            where: {
                studentId,
                homework: { courseId: { in: courseIds } },
            },
            include: {
                homework: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        courseId: true,
                        course: { select: { title: true } },
                    },
                },
            },
            orderBy: [{ gradedAt: 'desc' }, { submittedAt: 'desc' }],
        }),
        prisma.homework.count({ where: { courseId: { in: courseIds } } }),
        prisma.lessonProgress.findMany({
            where: { studentId, courseId: { in: courseIds } },
            select: { isCompleted: true, courseId: true, watchPercentage: true },
        }),
        prisma.liveSession.count({
            where: {
                courseId: { in: courseIds },
                type: 'GROUP',
                status: 'COMPLETED',
            },
        }),
    ]);
    const examSubs = examSubsRaw.filter((s) => s.exam && examInScopedCourses(s.exam));
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
        hwSubs,
        homeworksAssigned,
        lessonProgressRows,
        completedSessionsCount,
        totalSpent: 0,
        totalLessonsInEnrolledCourses: totalLessonsInCourses,
        attendanceSummary: (await getStudentAttendanceReport(studentId, courseIds)).summary,
    });
    return {
        student: user,
        ...bundle,
    };
};
//# sourceMappingURL=instructor-student.service.js.map