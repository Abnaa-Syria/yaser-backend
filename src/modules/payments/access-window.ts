import { AccessDurationUnit } from '@prisma/client';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function durationDaysFromParts(
  durationDays?: number | null,
  durationValue?: number | null,
  durationUnit?: AccessDurationUnit | null
) {
  if (durationDays && durationDays > 0) return durationDays;
  if (!durationValue || durationValue <= 0 || !durationUnit || durationUnit === 'LIFETIME') return null;

  switch (durationUnit) {
    case 'DAY':
      return durationValue;
    case 'WEEK':
      return durationValue * 7;
    case 'MONTH':
      return durationValue * 30;
    case 'YEAR':
      return durationValue * 365;
    default:
      return null;
  }
}

export function calculateAccessExpiresAt(start: Date, durationDays?: number | null) {
  if (!durationDays || durationDays <= 0) return null;
  return new Date(start.getTime() + durationDays * MS_PER_DAY);
}
