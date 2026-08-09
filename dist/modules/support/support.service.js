import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
// --- Student Actions ---
export const createTicket = async (userId, data) => {
    return await prisma.supportTicket.create({
        data: {
            creatorId: userId,
            subject: data.subject,
            priority: data.priority,
            messages: {
                create: {
                    senderId: userId,
                    message: data.description
                }
            }
        },
        include: { messages: true }
    });
};
export const createTicketForUser = async (creatorId, adminId, data) => {
    const user = await prisma.user.findUnique({ where: { id: creatorId }, select: { id: true } });
    if (!user)
        throw new AppError('User not found', 404);
    return await prisma.supportTicket.create({
        data: {
            creatorId,
            assignedToId: adminId,
            subject: data.subject,
            priority: data.priority,
            status: 'OPEN',
            messages: {
                create: {
                    senderId: adminId,
                    message: data.description,
                },
            },
        },
        include: { messages: true },
    });
};
export const getMyTickets = async (userId) => {
    return await prisma.supportTicket.findMany({
        where: { creatorId: userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' }
    });
};
export const replyToTicket = async (userId, ticketId, message) => {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket)
        throw new AppError('Ticket not found', 404);
    // Verify ownership or admin status
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
    });
    if (ticket.creatorId !== userId && user?.role?.name !== 'ADMIN') {
        throw new AppError('Unauthorized to reply to this ticket', 403);
    }
    return await prisma.ticketMessage.create({
        data: { ticketId, senderId: userId, message: message }
    });
};
// --- Admin Actions ---
export const getAllTickets = async (query) => {
    const { status, priority } = query;
    return await prisma.supportTicket.findMany({
        where: {
            status: status,
            priority: priority
        },
        include: {
            creator: { select: { fullName: true, email: true, avatar: true } },
            messages: { orderBy: { createdAt: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
export const adminReplyToTicket = async (ticketId, adminId, message) => {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket)
        throw new AppError('Ticket not found', 404);
    const [msg] = await prisma.$transaction([
        prisma.ticketMessage.create({
            data: { ticketId, senderId: adminId, message },
        }),
        prisma.supportTicket.update({
            where: { id: ticketId },
            data: { assignedToId: adminId, updatedAt: new Date() },
        }),
    ]);
    return msg;
};
export const processTicket = async (ticketId, adminId, status, response) => {
    return await prisma.$transaction(async (tx) => {
        const ticket = await tx.supportTicket.update({
            where: { id: ticketId },
            data: { status, assignedToId: adminId }
        });
        if (response) {
            await tx.ticketMessage.create({
                data: { ticketId, senderId: adminId, message: response }
            });
        }
        return ticket;
    });
};
export const getTicketById = async (id) => {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
            creator: { select: { id: true, fullName: true, email: true, avatar: true, role: true } },
            messages: { orderBy: { createdAt: 'asc' } }
        }
    });
    if (!ticket)
        throw new AppError('Ticket not found', 404);
    return ticket;
};
//# sourceMappingURL=support.service.js.map