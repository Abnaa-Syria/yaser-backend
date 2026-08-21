import { prisma } from '../prisma.js';
let cached = null;
const TTL_MS = 8000;
function parseBoolJson(raw) {
    if (raw === true)
        return true;
    if (raw === false || raw == null)
        return false;
    if (typeof raw === 'string')
        return raw.trim().toLowerCase() === 'true';
    if (typeof raw === 'number')
        return raw === 1;
    return false;
}
export function clearMaintenanceModeCache() {
    cached = null;
}
export async function isMaintenanceModeEnabled() {
    const now = Date.now();
    if (cached && now - cached.at < TTL_MS)
        return cached.value;
    const row = await prisma.platformSetting.findUnique({
        where: { key: 'MAINTENANCE_MODE' },
        select: { value: true },
    });
    const value = parseBoolJson(row?.value);
    cached = { value, at: now };
    return value;
}
//# sourceMappingURL=maintenance.service.js.map