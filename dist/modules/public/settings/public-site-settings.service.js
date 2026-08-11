import { prisma } from '../../../prisma.js';
import { APP_BRAND } from '../../../config/brand.config.js';
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
export async function getPublicSiteSettings() {
    const rows = await prisma.platformSetting.findMany({
        where: { key: { in: [...PUBLIC_SETTING_KEYS] } },
    });
    const map = {};
    for (const r of rows) {
        map[r.key] = jsonToString(r.value);
    }
    const phone = map.PHONE_NUMBER || map.SUPPORT_PHONE || '';
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
        social: {
            facebook: map.SOCIAL_FACEBOOK_URL || '',
            twitter: map.SOCIAL_TWITTER_URL || '',
            instagram: map.SOCIAL_INSTAGRAM_URL || '',
            linkedin: map.SOCIAL_LINKEDIN_URL || '',
        },
    };
}
//# sourceMappingURL=public-site-settings.service.js.map