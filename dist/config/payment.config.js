import { PLATFORM_CURRENCY } from './currency.js';
function buildManualPaymentInstructions() {
    const explicit = process.env.MANUAL_PAYMENT_INSTRUCTIONS?.trim();
    if (explicit)
        return explicit;
    const bankName = process.env.MANUAL_PAYMENT_BANK_NAME?.trim() || '';
    const accountName = process.env.MANUAL_PAYMENT_ACCOUNT_NAME?.trim() || '';
    const accountNumber = process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER?.trim() || '';
    const iban = process.env.MANUAL_PAYMENT_IBAN?.trim() || '';
    const lines = [
        'Use the official Yaser USMLE payment destination, then upload a clear proof of payment for admin review.',
    ];
    if (bankName)
        lines.push(`Bank: ${bankName}`);
    if (accountName)
        lines.push(`Account name: ${accountName}`);
    if (accountNumber)
        lines.push(`Account number: ${accountNumber}`);
    if (iban)
        lines.push(`IBAN: ${iban}`);
    const destinationUrl = process.env.MANUAL_PAYMENT_DESTINATION_URL?.trim();
    if (destinationUrl)
        lines.push(`Payment link: ${destinationUrl}`);
    return lines.join('\n');
}
export const PAYMENT_CONFIG = {
    methodLabel: process.env.MANUAL_PAYMENT_METHOD_LABEL || 'Manual bank transfer',
    instructions: buildManualPaymentInstructions(),
    destinationUrl: process.env.MANUAL_PAYMENT_DESTINATION_URL || '',
    bankName: process.env.MANUAL_PAYMENT_BANK_NAME?.trim() || '',
    accountName: process.env.MANUAL_PAYMENT_ACCOUNT_NAME?.trim() || '',
    accountNumber: process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER?.trim() || '',
    iban: process.env.MANUAL_PAYMENT_IBAN?.trim() || '',
    // Platform is USD-only; env override is ignored if set to anything else.
    currency: PLATFORM_CURRENCY,
};
//# sourceMappingURL=payment.config.js.map