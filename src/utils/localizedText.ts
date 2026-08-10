/**
 * Detect mojibake / charset-corruption placeholders often stored as "????".
 * Used so runtime can fall back to clean bilingual defaults.
 */
export function isCorruptedLocalizedText(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;

  // Pure replacement / question-mark junk
  if (/^[\s?؟�.]+$/u.test(text)) return true;

  const questionMarks = (text.match(/\?/g) || []).length;
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  // Many "?" and no Arabic letters → almost certainly corrupted Arabic payload
  if (questionMarks >= 3 && !hasArabic) return true;

  return false;
}

export function cleanLocalizedString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  if (!text || isCorruptedLocalizedText(text)) return fallback;
  return text;
}
