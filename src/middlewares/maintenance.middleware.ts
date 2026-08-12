import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyToken, type JwtPayload } from '../utils/security/jwt.js';
import { prisma } from '../prisma.js';
import { resolvePermissions } from '../services/permission-resolver.service.js';
import { notDeleted } from '../utils/soft-delete.js';
import { isMaintenanceModeEnabled } from '../services/maintenance.service.js';

const STAFF_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

async function isMaintenanceStaff(req: Request): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.split(' ')[1];
  if (!token) return false;

  try {
    const decoded = verifyToken({ token }) as JwtPayload;
    const user = await prisma.user.findFirst({
      where: notDeleted({ id: decoded.userId }),
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
        userPermissions: { include: { permission: true } },
      },
    });
    if (!user?.isActive) return false;

    const roleName = String(user.role?.name || '').toUpperCase();
    if (STAFF_ROLES.has(roleName)) return true;

    const perms = resolvePermissions(user.role, user.userPermissions);
    return perms.includes('*') || perms.includes('settings:manage');
  } catch {
    return false;
  }
}

/** Paths that must stay reachable so staff can sign in and the SPA can detect maintenance. */
function isAlwaysAllowed(req: Request): boolean {
  const method = req.method.toUpperCase();
  const path = req.path;

  if (method === 'GET' && (path === '/public/settings' || path.startsWith('/public/settings/'))) {
    return true;
  }

  // Payment / external callbacks should not break during maintenance windows.
  if (path.startsWith('/webhooks')) return true;

  if (!path.startsWith('/auth/')) return false;

  const authAllow = [
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/resend-verification',
  ];
  return authAllow.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export const maintenanceGuard = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const enabled = await isMaintenanceModeEnabled();
  if (!enabled) return next();

  if (isAlwaysAllowed(req)) return next();

  // Authenticated platform staff may use the full API (admin panel + preview).
  if (await isMaintenanceStaff(req)) {
    return next();
  }

  return next(
    Object.assign(new AppError('The platform is temporarily under maintenance. Please try again later.', 503), {
      code: 'MAINTENANCE',
    })
  );
});
