import { describe, expect, it, vi } from 'vitest';
import { requirePermission } from './permission.middleware.js';
import { AppError } from '../utils/AppError.js';

describe('permission middleware', () => {
  it('denies unauthenticated requests', () => {
    const next = vi.fn();
    requirePermission('course:manage')({} as any, {} as any, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('allows explicit permissions', () => {
    const next = vi.fn();
    requirePermission('course:manage')(
      { user: { role: { name: 'ADMIN' }, resolvedPermissions: ['course:manage'] } } as any,
      {} as any,
      next
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('denies missing permissions', () => {
    const next = vi.fn();
    requirePermission('role:manage')(
      { user: { role: { name: 'ADMIN' }, resolvedPermissions: ['course:manage'] } } as any,
      {} as any,
      next
    );

    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('allows super admin without explicit permissions', () => {
    const next = vi.fn();
    requirePermission('role:manage')(
      { user: { role: { name: 'SUPER_ADMIN' }, resolvedPermissions: [] } } as any,
      {} as any,
      next
    );

    expect(next).toHaveBeenCalledWith();
  });
});
