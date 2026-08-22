/** Merge `deletedAt: null` into Prisma where clauses for soft-deleted entities. */
export const notDeleted = <T extends Record<string, unknown>>(where: T = {} as T) => ({
  ...where,
  deletedAt: null,
});

export const softDeleteData = () => ({
  deletedAt: new Date(),
});

/**
 * Soft-delete a user while freeing unique email/username so the address can be re-registered.
 * Original email is preserved in the mangled local-part for audit.
 */
export const softDeleteUserIdentityData = (user: {
  id: string;
  email: string;
  username?: string | null;
}) => {
  const deletedAt = new Date();
  const stamp = deletedAt.getTime();
  const local = String(user.email).split('@')[0] || 'user';
  const safeLocal = local.replace(/[^a-zA-Z0-9._+-]/g, '_').slice(0, 40);

  return {
    deletedAt,
    isActive: false,
    email: `deleted.${safeLocal}.${user.id}.${stamp}@deleted.invalid`,
    username: null as string | null,
    emailVerificationToken: null as string | null,
    emailVerificationExpires: null as Date | null,
    passwordResetToken: null as string | null,
    passwordResetExpires: null as Date | null,
  };
};
