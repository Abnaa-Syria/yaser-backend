export const MAIL_CONFIG = {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM ||
        process.env.CONTACT_EMAIL ||
        'noreply@yaser-usmle.com',
    enabled: process.env.SMTP_ENABLED !== 'false',
};
export const isSmtpConfigured = () => Boolean(MAIL_CONFIG.host && MAIL_CONFIG.user && MAIL_CONFIG.pass);
//# sourceMappingURL=mail.config.js.map