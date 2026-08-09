import { User, Role, Permission, RolePermission, UserPermission } from '@prisma/client';

type RoleWithPermissions = Role & {
  permissions: (RolePermission & { permission: Permission })[];
};

type UserPermissionWithAction = UserPermission & { permission: Permission };

export interface UserPayload extends User {
  role: RoleWithPermissions;
  userPermissions?: UserPermissionWithAction[];
  resolvedPermissions: string[];
}

export interface TrialPayload {
  trialId: string;
  type: 'trial';
  expiresAt: string;
  fingerprint?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
      trial?: TrialPayload;
    }
  }
}
