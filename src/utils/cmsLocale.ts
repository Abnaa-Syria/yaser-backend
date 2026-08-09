export type LocalizedValue = string | { en?: string; ar?: string } | null | undefined;

export function pickLocalized(value: LocalizedValue, lang: string): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const isAr = String(lang).toLowerCase().startsWith('ar');
    const primary = isAr ? value.ar : value.en;
    const fallback = isAr ? value.en : value.ar;
    if (typeof primary === 'string' && primary.trim()) return primary;
    if (typeof fallback === 'string') return fallback;
  }
  return '';
}

export function splitLocalized(value: LocalizedValue): { en: string; ar: string } {
  if (typeof value === 'string') return { en: value, ar: '' };
  if (value && typeof value === 'object') {
    return {
      en: typeof value.en === 'string' ? value.en : '',
      ar: typeof value.ar === 'string' ? value.ar : '',
    };
  }
  return { en: '', ar: '' };
}

export function joinLocalized(en: string, ar: string): { en: string; ar: string } {
  return { en: en || '', ar: ar || '' };
}
