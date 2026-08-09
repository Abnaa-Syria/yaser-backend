import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { allocateLiveCommissionsForCoursePayment } from '../financials/commission-allocation.service.js';
export const listAllLiveSessions = async (query) => {
    const where = {};
    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { instructor: { fullName: { contains: query.search, mode: 'insensitive' } } },
        ];
    }
    return prisma.liveSession.findMany({
        where,
        orderBy: { startTime: 'desc' },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true, email: true } },
            course: { select: { id: true, title: true, type: true } },
        },
    });
};
export const createLiveSession = async (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (end.getTime() <= start.getTime()) {
        throw new AppError('End time must be after start time', 400);
    }
    if (data.courseId) {
        const course = await prisma.course.findFirst({
            where: { id: data.courseId, deletedAt: null },
            select: { id: true, type: true },
        });
        if (!course)
            throw new AppError('Course not found.', 404);
        if (course.type !== 'HYBRID') {
            throw new AppError('Live sessions can only be linked to HYBRID courses.', 400);
        }
    }
    const session = await prisma.liveSession.create({
        data: {
            title: data.title,
            description: data.description || null,
            type: 'GROUP',
            startTime: start,
            endTime: end,
            meetingUrl: data.meetingUrl || null,
            recordingUrl: data.recordingUrl || null,
            instructorId: data.instructorId,
            courseId: data.courseId || null,
            isFreeForAll: data.isFreeForAll,
            price: data.isFreeForAll ? 0 : (data.price != null ? Number(data.price) : 0),
            targetLevels: data.targetLevels ? data.targetLevels : null,
        },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true } },
            course: { select: { id: true, title: true } },
        },
    });
    // If course-linked, allocate live commissions for already paid payments
    if (data.courseId) {
        const paidCoursePayments = await prisma.payment.findMany({
            where: { courseId: data.courseId, status: 'PAID' },
            select: { id: true },
        });
        for (const p of paidCoursePayments) {
            try {
                await allocateLiveCommissionsForCoursePayment(p.id);
            }
            catch (err) {
                // Log error silently
                console.error('Commission allocation failed for live session', err);
            }
        }
    }
    return session;
};
export const updateLiveSession = async (id, data) => {
    const existing = await prisma.liveSession.findUnique({ where: { id } });
    if (!existing)
        throw new AppError('Live session not found.', 404);
    const updateData = {};
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.description !== undefined)
        updateData.description = data.description;
    if (data.meetingUrl !== undefined)
        updateData.meetingUrl = data.meetingUrl;
    if (data.recordingUrl !== undefined)
        updateData.recordingUrl = data.recordingUrl;
    if (data.instructorId !== undefined)
        updateData.instructorId = data.instructorId;
    if (data.courseId !== undefined)
        updateData.courseId = data.courseId || null;
    if (data.isFreeForAll !== undefined)
        updateData.isFreeForAll = data.isFreeForAll;
    if (data.price !== undefined) {
        updateData.price = data.isFreeForAll ? 0 : (data.price != null ? Number(data.price) : 0);
    }
    if (data.targetLevels !== undefined)
        updateData.targetLevels = data.targetLevels ? data.targetLevels : null;
    if (data.status !== undefined)
        updateData.status = data.status;
    if (data.startTime)
        updateData.startTime = new Date(data.startTime);
    if (data.endTime)
        updateData.endTime = new Date(data.endTime);
    const start = updateData.startTime || existing.startTime;
    const end = updateData.endTime || existing.endTime;
    if (end.getTime() <= start.getTime()) {
        throw new AppError('End time must be after start time', 400);
    }
    return prisma.liveSession.update({
        where: { id },
        data: updateData,
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true } },
            course: { select: { id: true, title: true } },
        },
    });
};
export const deleteLiveSession = async (id) => {
    const existing = await prisma.liveSession.findUnique({ where: { id } });
    if (!existing)
        throw new AppError('Live session not found.', 404);
    await prisma.liveSession.delete({ where: { id } });
    return { id, deleted: true };
};
//# sourceMappingURL=admin-live-session.service.js.map