import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
async function assertInstructorOwnsCourse(instructorId, courseId) {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
    });
    if (!course || course.instructorId !== instructorId) {
        throw new AppError('You are not authorized to manage questions in this course', 403);
    }
}
export const replyToQuestion = async (instructorId, questionId, body) => {
    const question = await prisma.lessonQuestion.findUnique({
        where: { id: questionId },
        include: {
            student: { select: { fullName: true } },
            lesson: {
                include: {
                    section: {
                        select: {
                            unit: {
                                select: {
                                    courseId: true,
                                    course: { select: { title: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!question)
        throw new AppError('Question not found', 404);
    await assertInstructorOwnsCourse(instructorId, question.lesson.section.unit.courseId);
    const answer = await prisma.lessonAnswer.create({
        data: {
            questionId,
            userId: instructorId,
            body,
            isInstructorReply: true,
        },
    });
    // Create real-time dashboard notification for student
    try {
        const courseTitle = question.lesson.section.unit.course.title;
        await prisma.notification.create({
            data: {
                userId: question.studentId,
                type: 'GENERAL',
                title: 'رد جديد على سؤالك',
                message: `قام المحاضر بالرد على سؤالك في درس "${question.lesson.title}" ضمن كورس "${courseTitle}"`,
            },
        });
    }
    catch (notifErr) {
        // Ignore notification errors to avoid breaking core Q&A reply operation
        console.error('Failed to create Q&A reply notification:', notifErr);
    }
    return answer;
};
export const toggleResolve = async (instructorId, questionId) => {
    const question = await prisma.lessonQuestion.findUnique({
        where: { id: questionId },
        include: {
            lesson: { include: { section: { select: { unit: { select: { courseId: true } } } } } },
        },
    });
    if (!question)
        throw new AppError('Question not found', 404);
    await assertInstructorOwnsCourse(instructorId, question.lesson.section.unit.courseId);
    return prisma.lessonQuestion.update({
        where: { id: questionId },
        data: { isResolved: !question.isResolved },
    });
};
export const listInstructorQuestions = async (instructorId, query) => {
    const pageNum = Number(query.page) || 1;
    const limitNum = Math.min(Number(query.limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const instructorCourses = await prisma.course.findMany({
        where: { instructorId },
        select: { id: true },
    });
    const courseIds = instructorCourses.map((c) => c.id);
    if (!courseIds.length) {
        return { questions: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 } };
    }
    const and = [
        { lesson: { section: { unit: { courseId: { in: courseIds } } } } },
    ];
    if (query.courseId)
        and.push({ lesson: { section: { unit: { courseId: query.courseId } } } });
    if (query.lessonId)
        and.push({ lessonId: query.lessonId });
    if (query.resolved !== undefined) {
        and.push({ isResolved: query.resolved === 'true' });
    }
    const where = { AND: and };
    const [questions, total] = await Promise.all([
        prisma.lessonQuestion.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                student: { select: { id: true, fullName: true, avatar: true } },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        section: {
                            select: {
                                unit: {
                                    select: {
                                        course: { select: { id: true, title: true } },
                                    },
                                },
                            },
                        },
                    },
                },
                answers: {
                    include: { user: { select: { id: true, fullName: true, avatar: true } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        }),
        prisma.lessonQuestion.count({ where }),
    ]);
    return {
        questions,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        },
    };
};
//# sourceMappingURL=instructor-qna.service.js.map