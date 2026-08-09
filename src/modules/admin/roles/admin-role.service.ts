import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

const ensurePermissionsExist = async (actions: string[]) => {
  const uniqueActions = [...new Set(actions)].filter(Boolean);
  if (uniqueActions.length === 0) return [];

  await prisma.permission.createMany({
    data: uniqueActions.map((action) => ({ action })),
    skipDuplicates: true,
  });

  return prisma.permission.findMany({
    where: { action: { in: uniqueActions } },
    select: { id: true, action: true },
  });
};

const mapRole = (role: {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: { permission: { action: string } }[];
  _count: { users: number };
  createdAt: Date;
}) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  isSystemRole: role.isSystemRole,
  permissions: role.permissions.map((rp) => rp.permission.action),
  userCount: role._count.users,
  createdAt: role.createdAt,
});

const roleInclude = {
  permissions: {
    include: { permission: { select: { action: true } } },
  },
  _count: { select: { users: true } },
} as const;

export const getAllRoles = async () => {
  const roles = await prisma.role.findMany({
    include: roleInclude,
    orderBy: { createdAt: 'desc' },
  });
  return roles.map(mapRole);
};

export const createRole = async (payload: {
  name: string;
  description?: string;
  permissions: string[];
}) => {
  const existing = await prisma.role.findUnique({ where: { name: payload.name } });
  if (existing) throw new AppError('Role name already exists', 409);

  const foundPermissions = await ensurePermissionsExist(payload.permissions);

  const role = await prisma.role.create({
    data: {
      name: payload.name,
      description: payload.description,
      permissions: {
        create: foundPermissions.map((permission) => ({
          permissionId: permission.id,
        })),
      },
    },
    include: roleInclude,
  });

  return mapRole(role);
};

export const updateRole = async (
  id: string,
  payload: { name?: string; description?: string; permissions?: string[] }
) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new AppError('Role not found', 404);
  if (role.isSystemRole && payload.name && payload.name !== role.name) {
    throw new AppError('System roles cannot be renamed', 400);
  }

  let permissionLinks: { permissionId: string }[] | undefined;
  if (payload.permissions) {
    const foundPermissions = await ensurePermissionsExist(payload.permissions);
    permissionLinks = foundPermissions.map((p) => ({ permissionId: p.id }));
  }

  const updated = await prisma.role.update({
    where: { id },
    data: {
      name: payload.name,
      description: payload.description,
      ...(permissionLinks
        ? {
            permissions: {
              deleteMany: {},
              create: permissionLinks,
            },
          }
        : {}),
    },
    include: roleInclude,
  });

  return mapRole(updated);
};

export const deleteRole = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw new AppError('Role not found', 404);
  if (role.isSystemRole) {
    throw new AppError('System roles cannot be deleted', 400);
  }
  if (role._count.users > 0) {
    throw new AppError('Cannot delete role assigned to users', 400);
  }

  await prisma.role.delete({ where: { id } });
  return { id, deleted: true };
};

export const setRolePermissions = async (id: string, permissions: string[]) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new AppError('Role not found', 404);

  const foundPermissions = await ensurePermissionsExist(permissions);

  const updated = await prisma.role.update({
    where: { id },
    data: {
      permissions: {
        deleteMany: {},
        create: foundPermissions.map((p) => ({ permissionId: p.id })),
      },
    },
    include: roleInclude,
  });

  return mapRole(updated);
};

export const getAllPermissions = async () => {
  return prisma.permission.findMany({ orderBy: { action: 'asc' } });
};
