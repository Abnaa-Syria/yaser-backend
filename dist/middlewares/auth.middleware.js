import { verifyToken } from '../utils/security/jwt.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { prisma } from '../prisma.js';
import { resolvePermissions } from '../services/permission-resolver.service.js';
import { notDeleted } from '../utils/soft-delete.js';
const userAuthInclude = {
    role: {
        include: {
            permissions: {
                include: { permission: true },
            },
        },
    },
    userPermissions: {
        include: { permission: true },
    },
};
export const protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    const decoded = verifyToken({ token });
    const currentUser = await prisma.user.findFirst({
        where: notDeleted({ id: decoded.userId }),
        include: userAuthInclude,
    });
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    if (!currentUser.isActive) {
        return next(new AppError('Your account has been deactivated. Contact support.', 403));
    }
    const resolvedPermissions = resolvePermissions(currentUser.role, currentUser.userPermissions);
    req.user = {
        ...currentUser,
        resolvedPermissions,
    };
    next();
});
/** Attach user when a valid Bearer token is present; never fail for guests. */
export const optionalProtect = catchAsync(async (req, _res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token)
        return next();
    try {
        const decoded = verifyToken({ token });
        const currentUser = await prisma.user.findFirst({
            where: notDeleted({ id: decoded.userId }),
            include: userAuthInclude,
        });
        if (currentUser?.isActive) {
            const resolvedPermissions = resolvePermissions(currentUser.role, currentUser.userPermissions);
            req.user = { ...currentUser, resolvedPermissions };
        }
    }
    catch {
        // ignore invalid/expired tokens for optional auth
    }
    next();
});
//# sourceMappingURL=auth.middleware.js.map