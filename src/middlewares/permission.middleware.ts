import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { isSuperAdmin } from '../services/permission-resolver.service.js';
import { getRoleName } from '../utils/role-query.js';

export const requirePermission = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('User not authenticated.', 401));
    }

    const roleName = getRoleName(user);

    if (isSuperAdmin(roleName)) {
      return next();
    }

    if (!user.resolvedPermissions?.includes(action)) {
      return next(new AppError(`Access Denied: Requires [${action}] permission.`, 403));
    }

    return next();
  };
};

export const requireAnyPermission = (...actions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('User not authenticated.', 401));
    }

    const roleName = getRoleName(user);

    if (isSuperAdmin(roleName)) {
      return next();
    }

    const hasAny = actions.some((action) => user.resolvedPermissions?.includes(action));

    if (!hasAny) {
      return next(
        new AppError(`Access Denied: Requires one of [${actions.join(', ')}].`, 403)
      );
    }

    return next();
  };
};
