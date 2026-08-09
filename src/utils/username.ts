import { prisma } from '../prisma.js';

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{1,48}[a-z0-9])?$/;

/** Normalize a candidate username for storage and lookup. */
export function normalizeUsername(raw: string | null | undefined): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 50);
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username) && username.length >= 3;
}

/** Build a username candidate from email or display name. */
export function usernameFromIdentity(input: { email?: string | null; fullName?: string | null; login?: string | null }) {
  const fromLogin = normalizeUsername(input.login || '');
  if (isValidUsername(fromLogin)) return fromLogin;

  const local = normalizeUsername(String(input.email || '').split('@')[0] || '');
  if (isValidUsername(local)) return local;

  const fromName = normalizeUsername(input.fullName || '');
  if (isValidUsername(fromName)) return fromName;

  return 'user';
}

/** Allocate a unique username, appending -2, -3, ... when needed. */
export async function allocateUniqueUsername(
  preferred: string,
  options: { excludeUserId?: string } = {}
): Promise<string> {
  let base = normalizeUsername(preferred);
  if (!isValidUsername(base)) base = 'user';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 40)}_${attempt + 1}`;
    const existing = await prisma.user.findFirst({
      where: {
        username: candidate,
        ...(options.excludeUserId ? { NOT: { id: options.excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  return `${base.slice(0, 30)}_${Date.now().toString(36)}`;
}
