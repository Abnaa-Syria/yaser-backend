import { normalizeLegacyEmail } from './mappers.js';

export type LegacyUserIdentity = {
  legacyId: string;
  email: string;
  phone?: string | null;
};

export type ImportConflict = {
  entityType: string;
  conflictType: string;
  severity: 'REVIEW' | 'BLOCKER';
  message: string;
  legacyId?: string;
};

export function detectDuplicateEmails(users: LegacyUserIdentity[]): ImportConflict[] {
  const byEmail = new Map<string, LegacyUserIdentity[]>();
  for (const user of users) {
    const email = normalizeLegacyEmail(user.email);
    if (!email) continue;
    byEmail.set(email, [...(byEmail.get(email) || []), user]);
  }

  const conflicts: ImportConflict[] = [];
  for (const [email, rows] of byEmail.entries()) {
    if (rows.length <= 1) continue;
    conflicts.push({
      entityType: 'User',
      conflictType: 'DUPLICATE_EMAIL',
      severity: 'BLOCKER',
      message: `Duplicate legacy email hash ${hashForReport(email)} appears ${rows.length} times.`,
      legacyId: rows.map((row) => row.legacyId).join(','),
    });
  }
  return conflicts;
}

export function detectDuplicatePhones(users: LegacyUserIdentity[]): ImportConflict[] {
  const byPhone = new Map<string, LegacyUserIdentity[]>();
  for (const user of users) {
    const phone = String(user.phone || '').replace(/[^\d+]/g, '');
    if (!phone) continue;
    byPhone.set(phone, [...(byPhone.get(phone) || []), user]);
  }

  const conflicts: ImportConflict[] = [];
  for (const [phone, rows] of byPhone.entries()) {
    if (rows.length <= 1) continue;
    conflicts.push({
      entityType: 'User',
      conflictType: 'DUPLICATE_PHONE',
      severity: 'REVIEW',
      message: `Duplicate legacy phone hash ${hashForReport(phone)} appears ${rows.length} times.`,
      legacyId: rows.map((row) => row.legacyId).join(','),
    });
  }
  return conflicts;
}

function hashForReport(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
