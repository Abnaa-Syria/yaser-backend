import { prisma } from '../prisma.js';
/** Canonical platform permissions that must exist in production. */
export const CANONICAL_PERMISSIONS = [
    'user:manage',
    'user:permission:grant',
    'role:manage',
    'course:manage',
    'course:review',
    'course:staff:manage',
    'curriculum:manage',
    'exam:manage',
    'flashcard:manage',
    'class:manage',
    'enrollment:manage',
    'finance:manage',
    'payment:manage',
    'payout:manage',
    'subscription:manage',
    'coupon:manage',
    'instructor:manage',
    'instructor_application:manage',
    'support:manage',
    'cms:manage',
    'settings:manage',
    'audit:read',
    'dashboard:read',
    'category:manage',
    'certificate:manage',
    'event:manage',
];
const SYSTEM_ROLE_PERMISSIONS = {
    SUPER_ADMIN: CANONICAL_PERMISSIONS,
    ADMIN: CANONICAL_PERMISSIONS.filter((p) => p !== 'user:permission:grant'),
};
/**
 * Idempotent RBAC repair for live environments that predate newer permissions
 * (e.g. event:manage). Safe to run on every boot.
 */
export async function ensureRbacCatalog() {
    await prisma.permission.createMany({
        data: CANONICAL_PERMISSIONS.map((action) => ({
            action,
            description: `Allows ${action}`,
        })),
        skipDuplicates: true,
    });
    const permissions = await prisma.permission.findMany({
        where: { action: { in: [...CANONICAL_PERMISSIONS] } },
        select: { id: true, action: true },
    });
    const byAction = new Map(permissions.map((p) => [p.action, p.id]));
    for (const [roleName, actions] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
        const role = await prisma.role.findFirst({
            where: { name: roleName },
            select: {
                id: true,
                permissions: { select: { permissionId: true, permission: { select: { action: true } } } },
            },
        });
        if (!role)
            continue;
        const existing = new Set(role.permissions.map((rp) => rp.permission.action));
        const missing = actions.filter((action) => !existing.has(action) && byAction.has(action));
        if (missing.length === 0)
            continue;
        await prisma.rolePermission.createMany({
            data: missing.map((action) => ({
                roleId: role.id,
                permissionId: byAction.get(action),
            })),
            skipDuplicates: true,
        });
        console.log(`[rbac] attached ${missing.join(', ')} to ${roleName}`);
    }
}
//# sourceMappingURL=ensureRbac.js.map