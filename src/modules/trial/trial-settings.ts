import type { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { cleanLocalizedString } from '../../utils/localizedText.js';

export const TRIAL_SETTING_KEYS = [
  'TRIAL_ENABLED',
  'TRIAL_DURATION_DAYS',
  'TRIAL_POPUP_ENABLED',
  'TRIAL_TITLE',
  'TRIAL_TITLE_AR',
  'TRIAL_SUBTITLE',
  'TRIAL_SUBTITLE_AR',
  'TRIAL_CTA_LABEL',
  'TRIAL_CTA_LABEL_AR',
  'TRIAL_DISMISS_DAYS',
] as const;

export type TrialSettingKey = (typeof TRIAL_SETTING_KEYS)[number];

export type TrialSettings = {
  enabled: boolean;
  durationDays: number;
  popupEnabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  ctaLabel: string;
  ctaLabelAr: string;
  dismissDays: number;
};

export const DEFAULT_TRIAL_SETTINGS: TrialSettings = {
  enabled: false,
  durationDays: 3,
  popupEnabled: true,
  title: 'Try Yaser USMLE free',
  titleAr: 'جرّب ياسر USMLE مجاناً',
  subtitle: 'Explore selected courses without creating an account.',
  subtitleAr: 'استكشف كورسات مختارة بدون إنشاء حساب.',
  ctaLabel: 'Start free trial',
  ctaLabelAr: 'ابدأ التجربة المجانية',
  dismissDays: 7,
};

function asBool(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function asNumber(value: unknown, fallback: number, min = 1, max = 365) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function asString(value: unknown, fallback: string) {
  return cleanLocalizedString(value, fallback);
}

export async function loadTrialSettings(): Promise<TrialSettings> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [...TRIAL_SETTING_KEYS] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    enabled: asBool(map.get('TRIAL_ENABLED'), DEFAULT_TRIAL_SETTINGS.enabled),
    durationDays: asNumber(map.get('TRIAL_DURATION_DAYS'), DEFAULT_TRIAL_SETTINGS.durationDays, 1, 90),
    popupEnabled: asBool(map.get('TRIAL_POPUP_ENABLED'), DEFAULT_TRIAL_SETTINGS.popupEnabled),
    title: asString(map.get('TRIAL_TITLE'), DEFAULT_TRIAL_SETTINGS.title),
    titleAr: asString(map.get('TRIAL_TITLE_AR'), DEFAULT_TRIAL_SETTINGS.titleAr),
    subtitle: asString(map.get('TRIAL_SUBTITLE'), DEFAULT_TRIAL_SETTINGS.subtitle),
    subtitleAr: asString(map.get('TRIAL_SUBTITLE_AR'), DEFAULT_TRIAL_SETTINGS.subtitleAr),
    ctaLabel: asString(map.get('TRIAL_CTA_LABEL'), DEFAULT_TRIAL_SETTINGS.ctaLabel),
    ctaLabelAr: asString(map.get('TRIAL_CTA_LABEL_AR'), DEFAULT_TRIAL_SETTINGS.ctaLabelAr),
    dismissDays: asNumber(map.get('TRIAL_DISMISS_DAYS'), DEFAULT_TRIAL_SETTINGS.dismissDays, 0, 365),
  };
}

export function trialSettingsToKeyMap(settings: Partial<TrialSettings>): Record<string, Prisma.InputJsonValue> {
  const out: Record<string, Prisma.InputJsonValue> = {};
  if (settings.enabled !== undefined) out.TRIAL_ENABLED = Boolean(settings.enabled);
  if (settings.durationDays !== undefined) {
    out.TRIAL_DURATION_DAYS = asNumber(settings.durationDays, DEFAULT_TRIAL_SETTINGS.durationDays, 1, 90);
  }
  if (settings.popupEnabled !== undefined) out.TRIAL_POPUP_ENABLED = Boolean(settings.popupEnabled);
  if (settings.title !== undefined) out.TRIAL_TITLE = String(settings.title).slice(0, 200);
  if (settings.titleAr !== undefined) out.TRIAL_TITLE_AR = String(settings.titleAr).slice(0, 200);
  if (settings.subtitle !== undefined) out.TRIAL_SUBTITLE = String(settings.subtitle).slice(0, 500);
  if (settings.subtitleAr !== undefined) out.TRIAL_SUBTITLE_AR = String(settings.subtitleAr).slice(0, 500);
  if (settings.ctaLabel !== undefined) out.TRIAL_CTA_LABEL = String(settings.ctaLabel).slice(0, 120);
  if (settings.ctaLabelAr !== undefined) out.TRIAL_CTA_LABEL_AR = String(settings.ctaLabelAr).slice(0, 120);
  if (settings.dismissDays !== undefined) {
    out.TRIAL_DISMISS_DAYS = asNumber(settings.dismissDays, DEFAULT_TRIAL_SETTINGS.dismissDays, 0, 365);
  }
  return out;
}

export async function listActiveTrialCourses() {
  return prisma.trialCourse.findMany({
    where: {
      isActive: true,
      course: { deletedAt: null, isActive: true },
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          shortDescription: true,
          shortDescriptionAr: true,
          thumbnail: true,
          coverImage: true,
          publishStatus: true,
          status: true,
          isActive: true,
        },
      },
    },
  });
}

export async function isCourseInActiveTrial(courseId: string) {
  const row = await prisma.trialCourse.findFirst({
    where: {
      courseId,
      isActive: true,
      course: { deletedAt: null, isActive: true },
    },
    select: { id: true },
  });
  return Boolean(row);
}
