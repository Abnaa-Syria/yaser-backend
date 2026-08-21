/** Shared defaults for public marketing page visibility. */
export const DEFAULT_PUBLIC_PAGE_VISIBILITY = {
  home: true,
  explore: true,
  packages: false,
  instructors: true,
  events: true,
  about: true,
  contact: true,
  faq: true,
  blogs: true,
  library: true,
  teach: true,
  guide: true,
  terms: true,
  privacy: true,
  refund: true,
};

export const PUBLIC_PAGE_VISIBILITY_KEY = 'PUBLIC_PAGE_VISIBILITY';

export function normalizePageVisibility(raw: unknown) {
  const base = { ...DEFAULT_PUBLIC_PAGE_VISIBILITY };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as Array<keyof typeof base>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      base[key] = Boolean(obj[key]);
    }
  }
  return base;
}
