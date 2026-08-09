import { describe, expect, it } from 'vitest';
import { isSuperAdmin, resolvePermissions } from './permission-resolver.service.js';
describe('permission resolver', () => {
    it('merges role and unexpired user permissions without duplicates', () => {
        const future = new Date(Date.now() + 60000);
        const past = new Date(Date.now() - 60000);
        const permissions = resolvePermissions({
            id: 'role-1',
            name: 'ADMIN',
            description: null,
            isSystemRole: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [
                {
                    id: 'rp1',
                    roleId: 'role-1',
                    permissionId: 'p1',
                    permission: { id: 'p1', action: 'courses.manage', description: null },
                },
            ],
        }, [
            {
                id: 'up1',
                userId: 'u1',
                permissionId: 'p1',
                createdAt: new Date(),
                expiresAt: future,
                permission: { id: 'p1', action: 'courses.manage', description: null },
            },
            {
                id: 'up2',
                userId: 'u1',
                permissionId: 'p2',
                createdAt: new Date(),
                expiresAt: past,
                permission: { id: 'p2', action: 'roles.manage', description: null },
            },
        ]);
        expect(permissions).toEqual(['courses.manage']);
    });
    it('detects super admin role names case-insensitively', () => {
        expect(isSuperAdmin('SUPER_ADMIN')).toBe(true);
        expect(isSuperAdmin('super_admin')).toBe(true);
        expect(isSuperAdmin('ADMIN')).toBe(false);
    });
});
//# sourceMappingURL=permission-resolver.service.test.js.map