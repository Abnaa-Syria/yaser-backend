/** Merge `deletedAt: null` into Prisma where clauses for soft-deleted entities. */
export const notDeleted = (where = {}) => ({
    ...where,
    deletedAt: null,
});
export const softDeleteData = () => ({
    deletedAt: new Date(),
});
//# sourceMappingURL=soft-delete.js.map