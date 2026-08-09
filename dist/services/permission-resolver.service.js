export const resolvePermissions = (role, userPermissions = []) => {
    const now = new Date();
    const fromRole = role?.permissions?.map((rp) => rp.permission.action) ?? [];
    const fromUser = userPermissions
        .filter((up) => !up.expiresAt || up.expiresAt > now)
        .map((up) => up.permission.action);
    return [...new Set([...fromRole, ...fromUser])];
};
export const isSuperAdmin = (roleName) => roleName?.toUpperCase() === 'SUPER_ADMIN';
//# sourceMappingURL=permission-resolver.service.js.map