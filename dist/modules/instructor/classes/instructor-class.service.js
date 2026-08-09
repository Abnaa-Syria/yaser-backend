import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
async function assertInstructorOwnsCourse(courseId, instructorId) {
    const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId, deletedAt: null },
        select: { id: true },
    });
    if (!course) {
        throw new AppError('Course not found or you do not have access.', 404);
    }
    return course;
}
export const getEnrolledStudents = async (instructorId, courseId) => {
    await assertInstructorOwnsCourse(courseId, instructorId);
    const purchases = await prisma.coursePurchase.findMany({
        where: { courseId },
        orderBy: { purchasedAt: 'desc' },
        include: {
            student: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                },
            },
            course: {
                select: {
                    title: true,
                },
            },
        },
    });
    return purchases.map((p) => ({
        enrollmentId: p.id,
        studentId: p.studentId,
        courseId: p.courseId,
        courseTitle: p.course?.title || '—',
        joinedAt: p.purchasedAt,
        purchasedAt: p.purchasedAt,
        progressPercentage: p.progressPercentage,
        completedLessonsCount: p.completedLessonsCount,
        isCompleted: p.isCompleted,
        student: p.student,
    }));
};
export const getAllEnrolledStudents = async (instructorId) => {
    const purchases = await prisma.coursePurchase.findMany({
        where: {
            course: {
                instructorId,
                deletedAt: null,
            },
        },
        orderBy: { purchasedAt: 'desc' },
        include: {
            student: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                },
            },
            course: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    });
    return purchases.map((p) => ({
        enrollmentId: p.id,
        studentId: p.studentId,
        courseId: p.courseId,
        courseTitle: p.course?.title || '—',
        joinedAt: p.purchasedAt,
        purchasedAt: p.purchasedAt,
        progressPercentage: p.progressPercentage,
        completedLessonsCount: p.completedLessonsCount,
        isCompleted: p.isCompleted,
        student: p.student,
    }));
};
//# sourceMappingURL=instructor-class.service.js.map