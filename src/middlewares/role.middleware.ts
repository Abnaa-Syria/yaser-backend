import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { getRoleName } from '../utils/role-query.js';

/** Restrict route to users whose dynamic role name matches one of the allowed values. */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = getRoleName(req.user);

    if (!userRole) {
      return next(new AppError('Access denied', 403));
    }

    const isAllowed = allowedRoles.some(
      (role) => role.toUpperCase() === userRole.toUpperCase()
    );

    if (!isAllowed) {
      return next(new AppError('Access denied for this role', 403));
    }

    next();
  };
};
