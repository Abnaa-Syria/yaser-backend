import { prisma } from '../../../prisma.js';
import { APP_BRAND } from '../../../config/brand.config.js';
import { DEFAULT_PUBLIC_PAGE_VISIBILITY, normalizePageVisibility, PUBLIC_PAGE_VISIBILITY_KEY, } from '../../../config/publicPageVisibility.js';
/** Keys exposed to the marketing site (Header/Footer). */
const PUBLIC_SETTING_KEYS = [
    'SITE_NAME',
    'CONTACT_EMAIL',
    'PHONE_NUMBER',
    'SUPPORT_PHONE',
    'SOCIAL_FACEBOOK_URL',
    'SOCIAL_TWITTER_URL',
    'SOCIAL_INSTAGRAM_URL',
    'SOCIAL_LINKEDIN_URL',
    'LOGO_PRIMARY_URL',
    'LOGO_LIGHT_URL',
    'LOGO_MARK_URL',
    'FOOTER_TAGLINE_EN',
    'FOOTER_TAGLINE_AR',
    'FOOTER_LOCATION_EN',
    'FOOTER_LOCATION_AR',
    'MAINTENANCE_MODE',
    PUBLIC_PAGE_VISIBILITY_KEY,
];
function jsonToString(v) {
    if (v === null || v === undefined)
        return '';
    if (typeof v === 'string')
        return v;
    if (typeof v === 'number' || typeof v === 'boolean')
        return String(v);
    return '';
}
function jsonToBool(v) {
    if (v === true)
        return true;
    if (v === false || v == null)
        return false;
    if (typeof v === 'string')
        return v.trim().toLowerCase() === 'true';
    if (typeof v === 'number')
        return v === 1;
    return false;
}
export async function getPublicSiteSettings() {
    const rows = await prisma.platformSetting.findMany({
        where: { key: { in: [...PUBLIC_SETTING_KEYS] } },
    });
    const map = {};
    let maintenanceMode = false;
    let pageVisibilityRaw = null;
    for (const r of rows) {
        if (r.key === 'MAINTENANCE_MODE') {
            maintenanceMode = jsonToBool(r.value);
            continue;
        }
        if (r.key === PUBLIC_PAGE_VISIBILITY_KEY) {
            pageVisibilityRaw = r.value;
            continue;
        }
        map[r.key] = jsonToString(r.value);
    }
    if (pageVisibilityRaw == null) {
        void prisma.platformSetting
            .upsert({
            where: { key: PUBLIC_PAGE_VISIBILITY_KEY },
            update: {},
            create: { key: PUBLIC_PAGE_VISIBILITY_KEY, value: DEFAULT_PUBLIC_PAGE_VISIBILITY },
        })
            .catch(() => undefined);
    }
    const phone = map.PHONE_NUMBER || map.SUPPORT_PHONE || '';
    const pageVisibility = normalizePageVisibility(pageVisibilityRaw);
    return {
        siteName: map.SITE_NAME || APP_BRAND.name,
        logoPrimaryUrl: map.LOGO_PRIMARY_URL || '',
        logoLightUrl: map.LOGO_LIGHT_URL || '',
        logoMarkUrl: map.LOGO_MARK_URL || '',
        contactEmail: map.CONTACT_EMAIL || APP_BRAND.contactEmail,
        phoneNumber: phone,
        footerTaglineEn: map.FOOTER_TAGLINE_EN || '',
        footerTaglineAr: map.FOOTER_TAGLINE_AR || '',
        footerLocationEn: map.FOOTER_LOCATION_EN || '',
        footerLocationAr: map.FOOTER_LOCATION_AR || '',
        maintenanceMode,
        pageVisibility,
        social: {
            facebook: map.SOCIAL_FACEBOOK_URL || '',
            twitter: map.SOCIAL_TWITTER_URL || '',
            instagram: map.SOCIAL_INSTAGRAM_URL || '',
            linkedin: map.SOCIAL_LINKEDIN_URL || '',
        },
    };
}
//# sourceMappingURL=public-site-settings.service.js.map