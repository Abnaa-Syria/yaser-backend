import type { Permission, Role, RolePermission, UserPermission } from '@prisma/client';

type RoleWithPermissions = Role & {
  permissions: (RolePermission & { permission: Permission })[];
};

type UserPermissionWithAction = UserPermission & { permission: Permission };

export const resolvePermissions = (
  role: RoleWithPermissions | null | undefined,
  userPermissions: UserPermissionWithAction[] = []
): string[] => {
  const now = new Date();
  const fromRole =
    role?.permissions?.map((rp) => rp.permission.action) ?? [];

  const fromUser = userPermissions
    .filter((up) => !up.expiresAt || up.expiresAt > now)
    .map((up) => up.permission.action);

  return [...new Set([...fromRole, ...fromUser])];
};

export const isSuperAdmin = (roleName: string | undefined): boolean =>
  roleName?.toUpperCase() === 'SUPER_ADMIN';
