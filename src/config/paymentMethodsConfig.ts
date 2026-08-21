/**
 * Dynamic checkout payment methods (country → methods).
 * Stored in PlatformSetting and editable from admin.
 */

export const PAYMENT_METHODS_CONFIG_KEY = 'PAYMENT_METHODS_CONFIG';

export type PaymentMethodType = 'manual' | 'external';

export type PaymentMethodDetail = {
  labelAr: string;
  labelEn: string;
  value: string;
};

export type PaymentMethodConfig = {
  id: string;
  type: PaymentMethodType;
  enabled: boolean;
  titleAr: string;
  titleEn: string;
  shortAr: string;
  shortEn: string;
  instructionsAr: string;
  instructionsEn: string;
  details: PaymentMethodDetail[];
  warningsAr: string[];
  warningsEn: string[];
  stepsAr: string[];
  stepsEn: string[];
  qrImageUrl: string;
  externalUrl: string;
  externalButtonLabelAr: string;
  externalButtonLabelEn: string;
};

export type PaymentCountryConfig = {
  id: string;
  enabled: boolean;
  labelAr: string;
  labelEn: string;
  methods: PaymentMethodConfig[];
};

export type PaymentMethodsConfig = {
  version: number;
  countries: PaymentCountryConfig[];
};

const IRAQ_STRIPE = 'https://buy.stripe.com/8x26oIdgU5DY5kO2QV9Ve0G';
const JORDAN_STRIPE = 'https://buy.stripe.com/5kQeVegt67M69B4ajn9Ve0h';
const DEFAULT_QR = '/uploads/payment-methods/iraq-superqi-qr.jpeg';

export const DEFAULT_PAYMENT_METHODS_CONFIG: PaymentMethodsConfig = {
  version: 1,
  countries: [
    {
      id: 'SY',
      enabled: true,
      labelAr: 'سوريا',
      labelEn: 'Syria',
      methods: [
        {
          id: 'AL_HARAM_FOUAD',
          type: 'manual',
          enabled: true,
          titleAr: 'التحويل عبر الهرم أو الفؤاد',
          titleEn: 'Al-Haram or Al-Fouad transfer',
          shortAr: 'تحويل يدوي',
          shortEn: 'Manual transfer',
          instructionsAr:
            'يتم التحويل إلى مندوبنا من خلال الهرم أو الفؤاد. بعد إتمام التحويل، صوّر الإيصال وارفعه على المنصة.',
          instructionsEn:
            'Transfer to our representative via Al-Haram or Al-Fouad. After payment, photograph the receipt and upload it on the platform.',
          details: [
            { labelAr: 'اسم المستلم', labelEn: 'Recipient name', value: 'محمد عبد الرزاق حاج محمد' },
            { labelAr: 'المدينة', labelEn: 'City', value: 'حلب' },
            { labelAr: 'رقم الهاتف', labelEn: 'Phone', value: '0968606800' },
          ],
          warningsAr: ['الرجاء عدم التحويل من خلال تطبيق شام كاش.'],
          warningsEn: ['Please do not transfer via the Sham Cash app.'],
          stepsAr: [
            'إتمام التحويل إلى بيانات المندوب الموضحة أعلاه.',
            'تصوير إيصال التحويل بشكل واضح.',
            'رفع الإيصال مع بياناتك وإرسال طلب التفعيل.',
            'مراجعة الطلب من الإدارة، ثم تفعيل الحساب.',
          ],
          stepsEn: [
            'Complete the transfer using the details above.',
            'Photograph a clear receipt.',
            'Upload the receipt with your details and submit activation.',
            'Admin reviews the request and activates your account.',
          ],
          qrImageUrl: '',
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
      ],
    },
    {
      id: 'IQ',
      enabled: true,
      labelAr: 'العراق',
      labelEn: 'Iraq',
      methods: [
        {
          id: 'SUPERQI',
          type: 'manual',
          enabled: true,
          titleAr: 'الدفع من خلال SuperQi',
          titleEn: 'Pay via SuperQi',
          shortAr: 'محفظة SuperQi',
          shortEn: 'SuperQi wallet',
          instructionsAr: 'ادفع عبر SuperQi ثم ارفع صورة إيصال التحويل على المنصة.',
          instructionsEn: 'Pay via SuperQi, then upload your transfer receipt on the platform.',
          details: [{ labelAr: 'رقم SuperQi', labelEn: 'SuperQi number', value: '07502363977' }],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: DEFAULT_QR,
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
        {
          id: 'CARD',
          type: 'external',
          enabled: true,
          titleAr: 'الدفع بالبطاقة البنكية',
          titleEn: 'Bank card payment',
          shortAr: 'Mastercard',
          shortEn: 'Mastercard',
          instructionsAr:
            'يمكن الدفع مباشرة باستخدام بطاقة Mastercard بشرط أن تدعم البطاقة الدفع بالدولار. لا حاجة لرفع إيصال داخل المنصة.',
          instructionsEn:
            'Pay directly with a Mastercard that supports USD. No receipt upload is required on the platform.',
          details: [],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: IRAQ_STRIPE,
          externalButtonLabelAr: 'الدفع بالبطاقة البنكية',
          externalButtonLabelEn: 'Pay by bank card',
        },
        {
          id: 'SARAFA_VODAFONE',
          type: 'manual',
          enabled: true,
          titleAr: 'الدفع من خلال محلات الصرافة',
          titleEn: 'Currency exchange offices',
          shortAr: 'تحويل إلى فودافون كاش مصر',
          shortEn: 'Transfer to Egypt Vodafone Cash',
          instructionsAr:
            'يمكن التحويل من خلال محلات الصرافة التي توفر التحويل إلى مصر عبر Vodafone Cash. رسوم التحويل يتحملها الطالب، ويجب ألا يتم خصمها من المبلغ المطلوب.',
          instructionsEn:
            'Transfer via exchange offices that send to Egypt Vodafone Cash. Transfer fees are paid by the student and must not be deducted from the required amount.',
          details: [
            { labelAr: 'المبلغ المطلوب وصوله', labelEn: 'Amount to arrive', value: '10,000 جنيه مصري كاملاً' },
            { labelAr: 'رقم Vodafone Cash', labelEn: 'Vodafone Cash number', value: '01036775984' },
          ],
          warningsAr: ['رسوم التحويل يتحملها الطالب، ويجب ألا يتم خصمها من المبلغ المطلوب.'],
          warningsEn: ['Transfer fees are the student’s responsibility and must not reduce the required amount.'],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
      ],
    },
    {
      id: 'JO',
      enabled: true,
      labelAr: 'الأردن',
      labelEn: 'Jordan',
      methods: [
        {
          id: 'VODAFONE_CASH',
          type: 'manual',
          enabled: true,
          titleAr: 'الدفع من خلال Vodafone Cash',
          titleEn: 'Pay via Vodafone Cash',
          shortAr: 'محلات الصرافة',
          shortEn: 'Exchange offices',
          instructionsAr: 'تتوفر هذه الطريقة لدى محلات الصرافة. بعد الدفع، ارفع صورة إيصال التحويل على المنصة.',
          instructionsEn:
            'Available at exchange offices. After payment, upload your transfer receipt on the platform.',
          details: [
            { labelAr: 'رقم Vodafone Cash', labelEn: 'Vodafone Cash number', value: '01036775984' },
            { labelAr: 'اسم المستلم', labelEn: 'Recipient name', value: 'Omama Hasan Zaiton' },
          ],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
        {
          id: 'CARD',
          type: 'external',
          enabled: true,
          titleAr: 'الدفع بالبطاقة البنكية',
          titleEn: 'Bank card payment',
          shortAr: 'Stripe',
          shortEn: 'Stripe',
          instructionsAr: 'ادفع بالبطاقة البنكية مباشرة من خلال رابط الدفع. لا حاجة لرفع إيصال يدوي داخل المنصة.',
          instructionsEn: 'Pay by card via the payment link. No manual receipt upload is required.',
          details: [],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: JORDAN_STRIPE,
          externalButtonLabelAr: 'الدفع بالبطاقة البنكية',
          externalButtonLabelEn: 'Pay by bank card',
        },
      ],
    },
    {
      id: 'EG',
      enabled: true,
      labelAr: 'مصر',
      labelEn: 'Egypt',
      methods: [
        {
          id: 'INSTAPAY_1',
          type: 'manual',
          enabled: true,
          titleAr: 'InstaPay — الرقم الأول',
          titleEn: 'InstaPay — number 1',
          shortAr: 'تحويل محلي',
          shortEn: 'Local transfer',
          instructionsAr: 'حوّل عبر InstaPay ثم ارفع صورة إيصال التحويل على المنصة.',
          instructionsEn: 'Transfer via InstaPay, then upload your receipt on the platform.',
          details: [{ labelAr: 'رقم InstaPay', labelEn: 'InstaPay number', value: '01555025446' }],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
        {
          id: 'INSTAPAY_2',
          type: 'manual',
          enabled: true,
          titleAr: 'InstaPay — الرقم الثاني',
          titleEn: 'InstaPay — number 2',
          shortAr: 'تحويل محلي',
          shortEn: 'Local transfer',
          instructionsAr: 'حوّل عبر InstaPay ثم ارفع صورة إيصال التحويل على المنصة.',
          instructionsEn: 'Transfer via InstaPay, then upload your receipt on the platform.',
          details: [{ labelAr: 'رقم InstaPay', labelEn: 'InstaPay number', value: '01558435446' }],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
        {
          id: 'VODAFONE_CASH',
          type: 'manual',
          enabled: true,
          titleAr: 'Vodafone Cash',
          titleEn: 'Vodafone Cash',
          shortAr: 'محفظة موبايل',
          shortEn: 'Mobile wallet',
          instructionsAr: 'حوّل عبر Vodafone Cash ثم ارفع صورة إيصال التحويل على المنصة.',
          instructionsEn: 'Transfer via Vodafone Cash, then upload your receipt on the platform.',
          details: [{ labelAr: 'رقم Vodafone Cash', labelEn: 'Vodafone Cash number', value: '01036775984' }],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: '',
          externalButtonLabelAr: '',
          externalButtonLabelEn: '',
        },
      ],
    },
    {
      id: 'OTHER',
      enabled: true,
      labelAr: 'باقي الدول',
      labelEn: 'Other countries',
      methods: [
        {
          id: 'CARD',
          type: 'external',
          enabled: true,
          titleAr: 'الدفع بالبطاقة البنكية',
          titleEn: 'Bank card payment',
          shortAr: 'Stripe',
          shortEn: 'Stripe',
          instructionsAr: 'يتم الدفع بالبطاقة البنكية مباشرة من خلال رابط Stripe. لا حاجة لرفع إيصال يدوي داخل المنصة.',
          instructionsEn: 'Pay by bank card via the Stripe link. No manual receipt upload is required.',
          details: [],
          warningsAr: [],
          warningsEn: [],
          stepsAr: [],
          stepsEn: [],
          qrImageUrl: '',
          externalUrl: IRAQ_STRIPE,
          externalButtonLabelAr: 'الدفع بالبطاقة البنكية',
          externalButtonLabelEn: 'Pay by bank card',
        },
      ],
    },
  ],
};

function asString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return fallback;
}

function asBool(v: unknown, fallback = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => asString(item)).filter(Boolean);
}

function normalizeDetail(raw: unknown): PaymentMethodDetail | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  return {
    labelAr: asString(d.labelAr),
    labelEn: asString(d.labelEn),
    value: asString(d.value),
  };
}

function normalizeMethod(raw: unknown): PaymentMethodConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const id = asString(m.id).trim();
  if (!id) return null;
  const type: PaymentMethodType = m.type === 'external' ? 'external' : 'manual';
  const details = Array.isArray(m.details)
    ? m.details.map(normalizeDetail).filter((d): d is PaymentMethodDetail => Boolean(d))
    : [];
  return {
    id,
    type,
    enabled: asBool(m.enabled, true),
    titleAr: asString(m.titleAr, id),
    titleEn: asString(m.titleEn, id),
    shortAr: asString(m.shortAr),
    shortEn: asString(m.shortEn),
    instructionsAr: asString(m.instructionsAr),
    instructionsEn: asString(m.instructionsEn),
    details,
    warningsAr: asStringArray(m.warningsAr),
    warningsEn: asStringArray(m.warningsEn),
    stepsAr: asStringArray(m.stepsAr),
    stepsEn: asStringArray(m.stepsEn),
    qrImageUrl: asString(m.qrImageUrl),
    externalUrl: asString(m.externalUrl),
    externalButtonLabelAr: asString(m.externalButtonLabelAr, 'الدفع بالبطاقة البنكية'),
    externalButtonLabelEn: asString(m.externalButtonLabelEn, 'Pay by bank card'),
  };
}

function normalizeCountry(raw: unknown): PaymentCountryConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const id = asString(c.id).trim().toUpperCase();
  if (!id) return null;
  const methods = Array.isArray(c.methods)
    ? c.methods.map(normalizeMethod).filter((m): m is PaymentMethodConfig => Boolean(m))
    : [];
  return {
    id,
    enabled: asBool(c.enabled, true),
    labelAr: asString(c.labelAr, id),
    labelEn: asString(c.labelEn, id),
    methods,
  };
}

export function normalizePaymentMethodsConfig(raw: unknown): PaymentMethodsConfig {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(DEFAULT_PAYMENT_METHODS_CONFIG);
  }
  const obj = raw as Record<string, unknown>;
  const countries = Array.isArray(obj.countries)
    ? obj.countries.map(normalizeCountry).filter((c): c is PaymentCountryConfig => Boolean(c))
    : [];
  if (!countries.length) {
    return structuredClone(DEFAULT_PAYMENT_METHODS_CONFIG);
  }
  return {
    version: typeof obj.version === 'number' ? obj.version : 1,
    countries,
  };
}

export function getEnabledCountries(config: PaymentMethodsConfig): PaymentCountryConfig[] {
  return config.countries.filter((c) => c.enabled !== false);
}

export function getEnabledMethods(country: PaymentCountryConfig | undefined): PaymentMethodConfig[] {
  return (country?.methods || []).filter((m) => m.enabled !== false);
}
