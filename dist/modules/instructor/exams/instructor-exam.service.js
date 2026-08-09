import { ExamType } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
const instructorExamScope = (instructorId) => ({
    OR: [
        { course: { instructorId } },
        { unit: { course: { instructorId } } },
        { lesson: { section: { unit: { course: { instructorId } } } } },
    ],
});
const verifyCourseOwnership = async (instructorId, courseId) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
    });
    if (!course)
        throw new AppError('Course not found.', 404);
    if (course.instructorId !== instructorId) {
        throw new AppError('You do not have permission to manage exams for this course.', 403);
    }
};
async function resolveExamCourseId(exam) {
    if (exam.courseId)
        return exam.courseId;
    if (exam.unitId) {
        const u = await prisma.unit.findUnique({ where: { id: exam.unitId }, select: { courseId: true } });
        return u?.courseId ?? null;
    }
    if (exam.lessonId) {
        const l = await prisma.lesson.findUnique({
            where: { id: exam.lessonId },
            select: { section: { select: { unit: { select: { courseId: true } } } } },
        });
        return l?.section.unit.courseId ?? null;
    }
    return null;
}
const verifyExamOwnership = async (instructorId, examId) => {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam)
        throw new AppError('Exam not found.', 404);
    const courseId = await resolveExamCourseId(exam);
    if (!courseId)
        throw new AppError('Exam not found.', 404);
    await verifyCourseOwnership(instructorId, courseId);
    return exam;
};
export const listInstructorExams = async (instructorId, query) => {
    const andConditions = [instructorExamScope(instructorId)];
    const where = {
        AND: andConditions,
    };
    const q = query.search?.trim();
    if (q) {
        andConditions.push({ title: { contains: q } });
    }
    return prisma.exam.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
            lesson: { select: { id: true, title: true } },
            _count: { select: { submissions: true, questions: true } },
        },
    });
};
export const getExamDetailForInstructor = async (instructorId, examId) => {
    await verifyExamOwnership(instructorId, examId);
    return prisma.exam.findUnique({
        where: { id: examId },
        include: {
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
            lesson: { select: { id: true, title: true } },
            questions: { orderBy: { order: 'asc' } },
            _count: { select: { submissions: true } },
        },
    });
};
export const getCourseStructureForInstructor = async (instructorId, courseId) => {
    await verifyCourseOwnership(instructorId, courseId);
    const units = await prisma.unit.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        select: {
            id: true,
            title: true,
            order: true,
            sections: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    order: true,
                    lessons: {
                        orderBy: { order: 'asc' },
                        select: { id: true, title: true, order: true },
                    },
                },
            },
        },
    });
    return { courseId, units, lessons: flattenLessonsFromUnits(units) };
};
function flattenLessonsFromUnits(units) {
    const lessons = [];
    for (const unit of units) {
        for (const section of unit.sections || []) {
            for (const lesson of section.lessons || []) {
                lessons.push({
                    id: lesson.id,
                    title: lesson.title,
                    order: lesson.order,
                    unitId: unit.id,
                    unitTitle: unit.title,
                    sectionId: section.id,
                    sectionTitle: section.title,
                });
            }
        }
    }
    return lessons;
}
export const createExam = async (instructorId, data) => {
    let unitId = data.unitId ?? null;
    let lessonId = data.lessonId ?? null;
    if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { section: { include: { unit: true } } },
        });
        if (!lesson)
            throw new AppError('Lesson not found.', 404);
        if (lesson.section.unit.courseId !== data.courseId) {
            throw new AppError('Lesson does not belong to the selected course.', 400);
        }
        unitId = lesson.section.unitId;
    }
    else if (unitId) {
        const unit = await prisma.unit.findUnique({ where: { id: unitId } });
        if (!unit || unit.courseId !== data.courseId) {
            throw new AppError('Unit does not belong to the selected course.', 400);
        }
    }
    await verifyCourseOwnership(instructorId, data.courseId);
    let type = ExamType.STANDALONE;
    if (lessonId)
        type = ExamType.LESSON;
    else if (unitId)
        type = ExamType.UNIT;
    return prisma.exam.create({
        data: {
            title: data.title,
            description: data.description ?? null,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            durationMinutes: data.durationMinutes,
            totalPoints: data.totalPoints,
            passingScore: data.passingScore,
            attempts: data.attempts ?? 2,
            courseId: data.courseId,
            unitId,
            lessonId,
            type,
            status: data.status || 'UPCOMING',
            coveredTopics: data.coveredTopics || [],
            examStructure: data.examStructure || [],
            importantInstructions: data.importantInstructions || [],
            preparationTips: data.preparationTips || [],
            readyMessage: data.readyMessage || null,
            targetLevels: data.targetLevels ? data.targetLevels : null,
        },
    });
};
export const updateExam = async (instructorId, examId, data) => {
    await verifyExamOwnership(instructorId, examId);
    const { title, description, status, type, scheduledAt, durationMinutes, totalPoints, passingScore, attempts, coveredTopics, examStructure, importantInstructions, preparationTips, readyMessage, } = data;
    return prisma.exam.update({
        where: { id: examId },
        data: {
            title,
            description,
            status,
            type,
            durationMinutes,
            totalPoints,
            passingScore,
            attempts,
            coveredTopics,
            examStructure,
            importantInstructions,
            preparationTips,
            readyMessage,
            targetLevels: data.targetLevels !== undefined ? data.targetLevels : undefined,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        },
    });
};
export const deleteExam = async (instructorId, examId) => {
    await verifyExamOwnership(instructorId, examId);
    await prisma.exam.delete({ where: { id: examId } });
    return { id: examId, deleted: true };
};
export const addQuestion = async (instructorId, examId, data) => {
    await verifyExamOwnership(instructorId, examId);
    return prisma.examQuestion.create({
        data: {
            examId,
            questionText: data.questionText,
            type: data.type,
            points: data.points,
            order: data.order,
            options: data.options,
            correctAnswer: data.correctAnswer,
        },
    });
};
export const updateQuestion = async (instructorId, examId, questionId, data) => {
    await verifyExamOwnership(instructorId, examId);
    return prisma.examQuestion.update({
        where: { id: questionId },
        data,
    });
};
export const removeQuestion = async (instructorId, examId, questionId) => {
    await verifyExamOwnership(instructorId, examId);
    await prisma.examQuestion.delete({
        where: { id: questionId },
    });
    return { id: questionId, deleted: true };
};
export const getExamSubmissions = async (instructorId, examId) => {
    await verifyExamOwnership(instructorId, examId);
    return prisma.examSubmission.findMany({
        where: { examId },
        include: {
            student: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
    });
};
//# sourceMappingURL=instructor-exam.service.js.map