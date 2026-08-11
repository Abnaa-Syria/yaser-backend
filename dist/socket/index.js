import { Server } from 'socket.io';
import { verifyToken } from '../utils/security/jwt.js';
import { prisma } from '../prisma.js';
import { notDeleted } from '../utils/soft-delete.js';
import { getRoleName } from '../utils/role-query.js';
let io = null;
export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',')
                : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
            credentials: true,
        },
        path: '/socket.io',
    });
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                (typeof socket.handshake.headers.authorization === 'string' &&
                    socket.handshake.headers.authorization.startsWith('Bearer ')
                    ? socket.handshake.headers.authorization.split(' ')[1]
                    : undefined);
            if (!token)
                return next(new Error('Unauthorized'));
            const decoded = verifyToken({ token });
            const user = await prisma.user.findFirst({
                where: notDeleted({ id: decoded.userId }),
                include: { role: true },
            });
            if (!user || !user.isActive)
                return next(new Error('Unauthorized'));
            socket.data.userId = user.id;
            socket.data.role = getRoleName(user);
            next();
        }
        catch {
            next(new Error('Unauthorized'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        socket.join(`user:${userId}`);
    });
    return io;
}
export function getIO() {
    return io;
}
/** @deprecated Live attendance was removed. */
export function emitAttendanceUpdated(_payload) {
    return;
}
/** @deprecated Live attendance was removed. */
export function emitSessionAttendanceRefresh(_sessionId, _detail) {
    return;
}
//# sourceMappingURL=index.js.map