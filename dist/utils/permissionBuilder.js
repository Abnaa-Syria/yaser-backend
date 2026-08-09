/**
 * Builds a permission string from an operation and an optional resource.
 * Example: buildPermission('create', 'user') => 'user:create'
 */
export const buildPermission = (operation, resource) => {
    if (!resource)
        return operation;
    return `${resource}:${operation}`;
};
//# sourceMappingURL=permissionBuilder.js.map