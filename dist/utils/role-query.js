import { prisma } from '../prisma.js';
import { AppError } from './AppError.js';
/** Prisma filter helpers for the dynamic Role model (replaces legacy string `user.role`). */
export const roleNameWhere = (name) => ({ name });
export const userHasRoleName = (name) => ({
    role: { name },
});
export const userHasRoleNameIn = (names) => ({
    role: { name: { in: names } },
});
/** Read role name from a user object that includes the `role` relation. */
export const getRoleName = (user) => user.role?.name;
/** Resolve a system role id by name (e.g. INSTRUCTOR, STUDENT). */
export const getRoleIdByName = async (name) => {
    const role = await prisma.role.findUnique({ where: { name } });
    if (!role)
        throw new AppError(`Role "${name}" is not configured.`, 500);
    return role.id;
};
//# sourceMappingURL=role-query.js.map