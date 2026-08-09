export type LegacyRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INSTRUCTOR'
  | 'CONTENT_REVIEWER'
  | 'STUDENT'
  | 'CONFLICT';

export function normalizeLegacyEmail(email: string | null | undefined) {
  return String(email || '').trim().toLowerCase();
}

export function sanitizeLegacyText(value: string | null | undefined) {
  return String(value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapLegacyRole(capabilityKeys: string[], authoredCourseCount = 0): LegacyRole {
  const caps = capabilityKeys.map((cap) => cap.toLowerCase());
  if (caps.includes('administrator')) return 'ADMIN';
  if (caps.includes('stm_lms_instructor')) return 'INSTRUCTOR';
  if (caps.includes('editor')) return authoredCourseCount > 0 ? 'INSTRUCTOR' : 'CONFLICT';
  if (caps.includes('shop_manager')) return 'CONTENT_REVIEWER';
  if (caps.includes('subscriber') || caps.includes('customer')) return 'STUDENT';
  return 'STUDENT';
}

export function durationDaysFromLegacy(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return Math.round(numeric);
  return null;
}
