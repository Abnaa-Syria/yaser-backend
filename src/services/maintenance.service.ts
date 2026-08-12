import { prisma } from '../prisma.js';

let cached: { value: boolean; at: number } | null = null;
const TTL_MS = 8_000;

function parseBoolJson(raw: unknown): boolean {
  if (raw === true) return true;
  if (raw === false || raw == null) return false;
  if (typeof raw === 'string') return raw.trim().toLowerCase() === 'true';
  if (typeof raw === 'number') return raw === 1;
  return false;
}

export function clearMaintenanceModeCache() {
  cached = null;
}

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.value;

  const row = await prisma.platformSetting.findUnique({
    where: { key: 'MAINTENANCE_MODE' },
    select: { value: true },
  });
  const value = parseBoolJson(row?.value);
  cached = { value, at: now };
  return value;
}
