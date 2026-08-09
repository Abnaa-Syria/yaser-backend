import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
async function assertInstructorOwnsHybridCourse(courseId, instructorId) {
    const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId, deletedAt: null },
        select: { id: true, type: true },
    });
    if (!course)
        throw new AppError('Course not found or you do not have access.', 404);
    if (course.type !== 'HYBRID') {
        throw new AppError('Live sessions can only be managed on HYBRID courses.', 400);
    }
    return course;
}
export const listCourseSessions = async (courseId, instructorId) => {
    await assertInstructorOwnsHybridCourse(courseId, instructorId);
    return prisma.liveSession.findMany({
        where: { courseId, type: 'GROUP' },
        orderBy: { startTime: 'asc' },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true, email: true } },
        },
    });
};
export const createCourseSession = async (courseId, instructorId, data) => {
    await assertInstructorOwnsHybridCourse(courseId, instructorId);
    return prisma.liveSession.create({
        data: {
            courseId,
            type: 'GROUP',
            title: data.title,
            description: data.description,
            instructorId,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            meetingUrl: data.meetingUrl,
        },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true } },
        },
    });
};
export const updateCourseSession = async (courseId, sessionId, instructorId, data) => {
    await assertInstructorOwnsHybridCourse(courseId, instructorId);
    const existing = await prisma.liveSession.findFirst({
        where: { id: sessionId, courseId, type: 'GROUP' },
    });
    if (!existing)
        throw new AppError('Session not found.', 404);
    return prisma.liveSession.update({
        where: { id: sessionId },
        data: {
            title: data.title,
            description: data.description,
            startTime: data.startTime ? new Date(data.startTime) : undefined,
            endTime: data.endTime ? new Date(data.endTime) : undefined,
            meetingUrl: data.meetingUrl,
            recordingUrl: data.recordingUrl,
            status: data.status,
        },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true } },
        },
    });
};
export const deleteCourseSession = async (courseId, sessionId, instructorId) => {
    await assertInstructorOwnsHybridCourse(courseId, instructorId);
    const existing = await prisma.liveSession.findFirst({
        where: { id: sessionId, courseId, type: 'GROUP' },
    });
    if (!existing)
        throw new AppError('Session not found.', 404);
    if (existing.status !== 'UPCOMING') {
        throw new AppError('Only upcoming sessions can be deleted.', 400);
    }
    await prisma.liveSession.delete({ where: { id: sessionId } });
    return { id: sessionId, deleted: true };
};
//# sourceMappingURL=instructor-session.service.js.map