import { Server } from 'socket.io';
import { verifyToken } from '../utils/security/jwt.js';
import { prisma } from '../prisma.js';
import { notDeleted } from '../utils/soft-delete.js';
import { getRoleName } from '../utils/role-query.js';
let io = null;
function roomStudent(studentId) {
    return `student:${studentId}`;
}
function roomSession(sessionId) {
    return `session:${sessionId}`;
}
function roomAdminStudent(studentId) {
    return `admin:student:${studentId}`;
}
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
        const role = socket.data.role;
        socket.join(`user:${userId}`);
        if (role === 'STUDENT') {
            socket.join(roomStudent(userId));
        }
        socket.on('attendance:join-session', (sessionId) => {
            if (role === 'INSTRUCTOR' && typeof sessionId === 'string' && sessionId) {
                socket.join(roomSession(sessionId));
            }
        });
        socket.on('attendance:leave-session', (sessionId) => {
            if (typeof sessionId === 'string' && sessionId) {
                socket.leave(roomSession(sessionId));
            }
        });
        socket.on('attendance:watch-student', (studentId) => {
            if ((role === 'ADMIN' || role === 'INSTRUCTOR') && typeof studentId === 'string' && studentId) {
                socket.join(roomAdminStudent(studentId));
            }
        });
        socket.on('attendance:unwatch-student', (studentId) => {
            if (typeof studentId === 'string' && studentId) {
                socket.leave(roomAdminStudent(studentId));
            }
        });
    });
    return io;
}
export function getIO() {
    return io;
}
export function emitAttendanceUpdated(payload) {
    if (!io)
        return;
    io.to(roomStudent(payload.studentId)).emit('attendance:updated', payload);
    io.to(roomAdminStudent(payload.studentId)).emit('attendance:updated', payload);
    io.to(roomSession(payload.sessionId)).emit('attendance:session:updated', payload);
}
export function emitSessionAttendanceRefresh(sessionId, detail) {
    if (!io)
        return;
    io.to(roomSession(sessionId)).emit('attendance:session:detail', { sessionId, detail });
}
//# sourceMappingURL=index.js.map