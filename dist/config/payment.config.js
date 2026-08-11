import { PLATFORM_CURRENCY } from './currency.js';
export const PAYMENT_CONFIG = {
    methodLabel: process.env.MANUAL_PAYMENT_METHOD_LABEL || 'Manual bank transfer',
    instructions: process.env.MANUAL_PAYMENT_INSTRUCTIONS ||
        'Use the official Yaser USMLE payment destination, then upload a clear proof of payment for admin review.',
    destinationUrl: process.env.MANUAL_PAYMENT_DESTINATION_URL || '',
    // Platform is USD-only; env override is ignored if set to anything else.
    currency: PLATFORM_CURRENCY,
};
//# sourceMappingURL=payment.config.js.map