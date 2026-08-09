import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { allocateLiveCommissionsForCoursePayment } from '../../admin/financials/commission-allocation.service.js';
export const listCourseSessions = async (courseId) => {
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course)
        throw new AppError('Course not found.', 404);
    return prisma.liveSession.findMany({
        where: { courseId, type: 'GROUP' },
        orderBy: { startTime: 'asc' },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true, email: true } },
        },
    });
};
export const createCourseSession = async (courseId, data) => {
    const course = await prisma.course.findFirst({
        where: { id: courseId, deletedAt: null },
        select: { id: true, type: true },
    });
    if (!course)
        throw new AppError('Course not found.', 404);
    if (course.type !== 'HYBRID') {
        throw new AppError('Live sessions can only be added to HYBRID courses.', 400);
    }
    const session = await prisma.liveSession.create({
        data: {
            courseId,
            type: 'GROUP',
            title: data.title,
            description: data.description,
            instructorId: data.instructorId,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            meetingUrl: data.meetingUrl,
        },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true } },
        },
    });
    const paidCoursePayments = await prisma.payment.findMany({
        where: { courseId, status: 'PAID' },
        select: { id: true },
    });
    for (const p of paidCoursePayments) {
        await allocateLiveCommissionsForCoursePayment(p.id);
    }
    return session;
};
export const updateCourseSession = async (courseId, sessionId, data) => {
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
            instructorId: data.instructorId,
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
export const deleteCourseSession = async (courseId, sessionId) => {
    const existing = await prisma.liveSession.findFirst({
        where: { id: sessionId, courseId, type: 'GROUP' },
    });
    if (!existing)
        throw new AppError('Session not found.', 404);
    await prisma.liveSession.delete({ where: { id: sessionId } });
    return { id: sessionId, deleted: true };
};
//# sourceMappingURL=admin-live-session.service.js.map