import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';
import { notDeleted, softDeleteUserIdentityData } from '../../../utils/soft-delete.js';
import { logAudit } from '../../../services/audit-logger.service.js';
import { deactivateAllUserSessions } from '../../../services/session.service.js';
import { hashPassword } from '../../../utils/security/hash.js';
import { allocateUniqueUsername, usernameFromIdentity } from '../../../utils/username.js';

/**
 * Get all platform users with filtering and pagination
 */
export const getAllUsers = async (query: any) => {
  const { role, isActive, search } = query;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const isStudentList = role === 'STUDENT';

  const where: any = notDeleted();
  if (role) Object.assign(where, userHasRoleName(role));
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
  if (search) {
    const q = String(search).trim();
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { username: { contains: q } },
        { phone: { contains: q } },
      ];
    }
  }

  const baseSelect: Record<string, boolean | object> = {
    id: true,
    email: true,
    username: true,
    fullName: true,
    phone: true,
    avatar: true,
    role: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  };

  const studentSelect = {
    ...baseSelect,
    _count: { select: { coursePurchases: true } },
    coursePurchases: {
      take: 10,
      orderBy: { purchasedAt: 'desc' as const },
      select: {
        purchasedAt: true,
        course: { select: { title: true } },
      },
    },
  };

  const [usersRaw, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: (isStudentList ? studentSelect : baseSelect) as any,
    }),
    prisma.user.count({ where }),
  ]);

  let studentListStats: {
    totalAll: number;
    joinedThisMonth: number;
    joinedThisWeek: number;
  } | undefined;

  if (isStudentList) {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startWeek = new Date(now.getTime() - 7 * 86400000);
    const [totalAll, joinedThisMonth, joinedThisWeek] = await Promise.all([
      prisma.user.count({ where: notDeleted(userHasRoleName('STUDENT')) }),
      prisma.user.count({
        where: notDeleted({ ...userHasRoleName('STUDENT'), createdAt: { gte: startMonth } }),
      }),
      prisma.user.count({
        where: notDeleted({ ...userHasRoleName('STUDENT'), createdAt: { gte: startWeek } }),
      }),
    ]);
    studentListStats = { totalAll, joinedThisMonth, joinedThisWeek };
  }

  const users = isStudentList
    ? (usersRaw as any[]).map((u) => {
        const purchases = u.coursePurchases || [];
        const titles = [...new Set(purchases.map((e: any) => e.course?.title).filter(Boolean))];
        const { coursePurchases, _count, ...rest } = u;
        const enrollmentCount = _count?.coursePurchases ?? 0;
        const coursesSummary =
          titles.length === 0
            ? null
            : titles.length <= 2
              ? titles.join(', ')
              : `${titles.slice(0, 2).join(', ')} +${titles.length - 2}`;
        return {
          ...rest,
          enrollmentCount,
          coursesSummary,
        };
      })
    : usersRaw;

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    studentListStats,
  };
};

/**
 * Create a staff/assistant user directly from the admin dashboard
 * (e.g. teaching assistants, content reviewers, financial managers).
 */
export const createStaffUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
}) => {
  const email = data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) throw new AppError('Email is already in use.', 409);
  if (existing?.deletedAt) {
    await prisma.user.update({
      where: { id: existing.id },
      data: softDeleteUserIdentityData(existing),
    });
  }

  const role = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (!role) throw new AppError('Role not found.', 404);

  const hashedPassword = await hashPassword(data.password);
  const username = await allocateUniqueUsername(
    usernameFromIdentity({ email, fullName: data.fullName })
  );

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email,
      username,
      password: hashedPassword,
      roleId: data.roleId,
      phone: data.phone?.trim() || null,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Get specific user details
 */
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatar: true,
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      isActive: true,
      academicLevel: true,
      userPermissions: { include: { permission: true } },
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new AppError('User not found.', 404);
  return user;
};

/**
 * Update user details (Admin only)
 */
export const updateUser = async (id: string, data: any) => {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Toggle user active status
 */
export const toggleUserActive = async (id: string, actorId: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found.', 404);

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  await logAudit({
    userId: actorId,
    action: 'USER_TOGGLE_ACTIVE',
    entityType: 'USER',
    entityId: id,
    details: { isActive: updatedUser.isActive },
  });

  return { id: updatedUser.id, isActive: updatedUser.isActive };
};

export const setUserPasswordByAdmin = async (id: string, newPassword: string, actorId: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found.', 404);

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
  await deactivateAllUserSessions(id);

  await logAudit({
    userId: actorId,
    action: 'USER_PASSWORD_RESET_BY_ADMIN',
    entityType: 'USER',
    entityId: id,
  });

  return { id, message: 'Password updated successfully.' };
};

export const deleteUser = async (id: string, actorId: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found.', 404);
  if (user.deletedAt) throw new AppError('User already deleted.', 404);

  await prisma.user.update({
    where: { id },
    data: softDeleteUserIdentityData(user),
  });
  await deactivateAllUserSessions(id);
  await logAudit({
    userId: actorId,
    action: 'USER_SOFT_DELETED',
    entityType: 'USER',
    entityId: id,
    details: { previousEmail: user.email },
  });
  return { id, deleted: true };
};

export const grantUserPermission = async (
  userId: string,
  permissionId: string,
  expiresAt: Date | null,
  actorId: string
) => {
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
  if (!permission) throw new AppError('Permission not found', 404);

  const grant = await prisma.userPermission.upsert({
    where: { userId_permissionId: { userId, permissionId } },
    create: { userId, permissionId, expiresAt: expiresAt ?? undefined },
    update: { expiresAt: expiresAt ?? null },
    include: { permission: true },
  });

  await logAudit({
    userId: actorId,
    action: 'USER_PERMISSION_GRANTED',
    entityType: 'USER',
    entityId: userId,
    details: { permission: permission.action, expiresAt },
  });

  return grant;
};

export const revokeUserPermission = async (
  userId: string,
  permissionId: string,
  actorId: string
) => {
  await prisma.userPermission.delete({
    where: { userId_permissionId: { userId, permissionId } },
  });
  await logAudit({
    userId: actorId,
    action: 'USER_PERMISSION_REVOKED',
    entityType: 'USER',
    entityId: userId,
    details: { permissionId },
  });
  return { revoked: true };
};

export const getUserSessions = async (userId: string) => {
  return prisma.userSession.findMany({
    where: { studentId: userId },
    orderBy: { lastHeartbeatAt: 'desc' },
    include: {
      device: { select: { deviceName: true, os: true, deviceFingerprint: true } },
    },
  });
};

export const getUserDevices = async (userId: string) => {
  return prisma.userDevice.findMany({
    where: { studentId: userId },
    orderBy: { updatedAt: 'desc' },
  });
};

export const forceLogoutUser = async (userId: string, actorId: string) => {
  await deactivateAllUserSessions(userId);
  await logAudit({
    userId: actorId,
    action: 'USER_FORCE_LOGOUT',
    entityType: 'USER',
    entityId: userId,
  });
  return { userId, loggedOut: true };
};
