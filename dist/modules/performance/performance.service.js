import { prisma } from '../../prisma.js';
/**
 * Recalculates and updates the performance metrics for a student in a specific course.
 */
export const updateStudentPerformance = async (studentId, courseId) => {
    const examSubmissions = await prisma.examSubmission.findMany({
        where: {
            studentId,
            submittedAt: { not: null },
            exam: {
                OR: [
                    { courseId },
                    { unit: { courseId } },
                    { lesson: { section: { unit: { courseId } } } },
                ],
            },
        },
        select: { totalScore: true },
    });
    const totalExams = examSubmissions.length;
    const averageExamScore = totalExams > 0
        ? examSubmissions.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalExams
        : 0;
    const homeworkSubmissions = await prisma.homeworkSubmission.findMany({
        where: {
            studentId,
            homework: { courseId },
        },
        select: { status: true, grade: true },
    });
    const completedHomework = homeworkSubmissions.filter((s) => s.status === 'GRADED').length;
    const lateHomework = 0;
    const averageHomeworkGrade = homeworkSubmissions.length > 0
        ? homeworkSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / homeworkSubmissions.length
        : 0;
    const completedSessions = await prisma.liveClassAttendance.count({
        where: {
            studentId,
            liveSession: { courseId, status: 'COMPLETED' },
        },
    });
    return prisma.studentPerformance.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        update: {
            averageExamScore: Math.round(averageExamScore * 100) / 100,
            homeworkCompleted: completedHomework,
            homeworkLate: lateHomework,
            averageGrade: Math.round(averageHomeworkGrade * 100) / 100,
            classesAttended: completedSessions,
        },
        create: {
            studentId,
            courseId,
            averageExamScore: Math.round(averageExamScore * 100) / 100,
            homeworkCompleted: completedHomework,
            homeworkLate: lateHomework,
            averageGrade: Math.round(averageHomeworkGrade * 100) / 100,
            classesAttended: completedSessions,
        },
    });
};
export const getCourseIdFromExam = async (examId) => {
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: {
            courseId: true,
            unit: { select: { courseId: true } },
            lesson: { select: { section: { select: { unit: { select: { courseId: true } } } } } },
        },
    });
    if (!exam)
        return null;
    return exam.courseId || exam.unit?.courseId || exam.lesson?.section?.unit?.courseId || null;
};
//# sourceMappingURL=performance.service.js.map