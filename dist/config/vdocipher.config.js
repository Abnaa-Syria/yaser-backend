export const VDOCIPHER_CONFIG = {
    get apiSecret() {
        return (process.env.VDOCIPHER_API_SECRET || '').trim();
    },
    get baseUrl() {
        return process.env.VDOCIPHER_API_BASE_URL || 'https://dev.vdocipher.com/api';
    },
    /** OTP lifetime in seconds (VdoCipher default window is short-lived). */
    get otpTtlSeconds() {
        return Number(process.env.VDOCIPHER_OTP_TTL_SECONDS || 300);
    },
};
export const isVdoCipherConfigured = () => Boolean(VDOCIPHER_CONFIG.apiSecret);
//# sourceMappingURL=vdocipher.config.js.map