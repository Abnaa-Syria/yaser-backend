export function pickLocalized(value, lang) {
    if (value == null)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'object') {
        const isAr = String(lang).toLowerCase().startsWith('ar');
        const primary = isAr ? value.ar : value.en;
        const fallback = isAr ? value.en : value.ar;
        if (typeof primary === 'string' && primary.trim())
            return primary;
        if (typeof fallback === 'string')
            return fallback;
    }
    return '';
}
export function splitLocalized(value) {
    if (typeof value === 'string')
        return { en: value, ar: '' };
    if (value && typeof value === 'object') {
        return {
            en: typeof value.en === 'string' ? value.en : '',
            ar: typeof value.ar === 'string' ? value.ar : '',
        };
    }
    return { en: '', ar: '' };
}
export function joinLocalized(en, ar) {
    return { en: en || '', ar: ar || '' };
}
//# sourceMappingURL=cmsLocale.js.map