import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
// ─── Create Event ─────────────────────────────────────────────────────────────
export const createEvent = async (data) => {
    return prisma.communityEvent.create({
        data: {
            titleAr: data.titleAr.trim(),
            titleEn: data.titleEn.trim(),
            descriptionAr: data.descriptionAr.trim(),
            descriptionEn: data.descriptionEn.trim(),
            eventDate: new Date(data.eventDate),
            location: data.location.trim(),
            bannerUrl: data.bannerUrl ? data.bannerUrl.trim() : null,
            isActive: true,
        },
    });
};
// ─── Get All Events for Admin (Paginated) ──────────────────────────────────────
export const getAllEventsForAdmin = async (query) => {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, parseInt(query.limit || '10', 10));
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
        prisma.communityEvent.findMany({
            orderBy: { eventDate: 'desc' },
            skip,
            take: limit,
        }),
        prisma.communityEvent.count(),
    ]);
    return {
        events,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
// ─── Update Event ─────────────────────────────────────────────────────────────
export const updateEvent = async (id, data) => {
    const existing = await prisma.communityEvent.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError('Event not found.', 404);
    }
    const updateData = {};
    if (data.titleAr !== undefined)
        updateData.titleAr = data.titleAr.trim();
    if (data.titleEn !== undefined)
        updateData.titleEn = data.titleEn.trim();
    if (data.descriptionAr !== undefined)
        updateData.descriptionAr = data.descriptionAr.trim();
    if (data.descriptionEn !== undefined)
        updateData.descriptionEn = data.descriptionEn.trim();
    if (data.eventDate !== undefined)
        updateData.eventDate = new Date(data.eventDate);
    if (data.location !== undefined)
        updateData.location = data.location.trim();
    if (data.bannerUrl !== undefined)
        updateData.bannerUrl = data.bannerUrl ? data.bannerUrl.trim() : null;
    if (data.isActive !== undefined)
        updateData.isActive = data.isActive;
    return prisma.communityEvent.update({
        where: { id },
        data: updateData,
    });
};
// ─── Delete Event ─────────────────────────────────────────────────────────────
export const deleteEvent = async (id) => {
    const existing = await prisma.communityEvent.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError('Event not found.', 404);
    }
    return prisma.communityEvent.delete({ where: { id } });
};
// ─── Public active events ──────────────────────────────────────────────────────
export const getPublicActiveEvents = async () => {
    return prisma.communityEvent.findMany({
        where: { isActive: true },
        orderBy: { eventDate: 'asc' }, // sorted chronologically for upcoming ones
    });
};
// ─── Get single active event ───────────────────────────────────────────────────
export const getPublicActiveEventById = async (id) => {
    const event = await prisma.communityEvent.findUnique({
        where: { id },
    });
    if (!event || !event.isActive) {
        throw new AppError('Event not found or is inactive.', 404);
    }
    return event;
};
//# sourceMappingURL=event.service.js.map