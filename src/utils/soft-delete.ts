/** Merge `deletedAt: null` into Prisma where clauses for soft-deleted entities. */
export const notDeleted = <T extends Record<string, unknown>>(where: T = {} as T) => ({
  ...where,
  deletedAt: null,
});

export const softDeleteData = () => ({
  deletedAt: new Date(),
});
