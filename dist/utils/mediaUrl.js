import { z } from 'zod';
const emptyToUndefined = (val) => val === '' || val === null || val === 'null' || val === 'undefined' ? undefined : val;
const emptyToNull = (val) => val === '' || val === null || val === 'null' || val === 'undefined' ? null : val;
/** Absolute http(s) URL or local media library path from uploads. */
export const mediaUrlString = z
    .string()
    .max(2000)
    .refine((val) => {
    const v = val.trim();
    if (!v)
        return false;
    if (v.startsWith('/uploads/'))
        return true;
    try {
        const u = new URL(v);
        return u.protocol === 'http:' || u.protocol === 'https:';
    }
    catch {
        return false;
    }
}, { message: 'Invalid URL' });
/** Optional media URL — empty string becomes undefined. */
export const optionalMediaUrl = z.preprocess(emptyToUndefined, mediaUrlString.optional());
/** Optional nullable media URL — empty string becomes null. */
export const optionalNullableMediaUrl = z.preprocess(emptyToNull, mediaUrlString.nullable().optional());
/** Required media URL (no empty). */
export const requiredMediaUrl = mediaUrlString;
/** Accept absolute URL, /uploads/ path, or empty string (kept as ''). */
export const mediaUrlOrEmpty = z.union([mediaUrlString, z.literal('')]);
//# sourceMappingURL=mediaUrl.js.map