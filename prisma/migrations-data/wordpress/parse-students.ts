import fs from 'fs';
import path from 'path';
import { mapLegacyRole, normalizeLegacyEmail, sanitizeLegacyText, type LegacyRole } from './mappers.js';
import { detectDuplicateEmails, type ImportConflict } from './conflicts.js';

export type ParsedLegacyStudentCandidate = {
  legacyId: string;
  login: string;
  email: string;
  hash: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  capabilityKeys: string[];
  mappedRole: LegacyRole;
};

export type StudentImportPlan = {
  filePath: string;
  totalUsers: number;
  eligibleStudents: ParsedLegacyStudentCandidate[];
  skippedNonStudents: number;
  skippedUnsupportedHash: number;
  skippedInvalidEmail: number;
  duplicateEmailConflicts: ImportConflict[];
  roleBreakdown: Record<string, number>;
};

/** Parse WordPress dump for student-only import planning. */
export function buildStudentImportPlan(filePath: string): StudentImportPlan {
  const absolutePath = path.resolve(filePath);
  const sql = fs.readFileSync(absolutePath, 'utf8');
  const prefix = inferTablePrefix(sql) || 'wp_';
  const users = parseWpUsersRich(sql, prefix);
  const meta = parseUserMeta(sql, prefix);

  const roleBreakdown: Record<string, number> = {};
  const eligible: ParsedLegacyStudentCandidate[] = [];
  let skippedNonStudents = 0;
  let skippedUnsupportedHash = 0;
  let skippedInvalidEmail = 0;

  for (const user of users) {
    const caps = meta.capabilities.get(user.legacyId) || [];
    const mappedRole = mapLegacyRole(caps);
    roleBreakdown[mappedRole] = (roleBreakdown[mappedRole] || 0) + 1;

    const email = normalizeLegacyEmail(user.email);
    if (!email || !email.includes('@')) {
      skippedInvalidEmail += 1;
      continue;
    }
    if (!user.hash.startsWith('$wp$2y$') && !user.hash.startsWith('$wp$2b$')) {
      skippedUnsupportedHash += 1;
      continue;
    }

    // Import every login-capable WP account as a student on this single-instructor platform.
    // WordPress administrators/editors are site users here — not platform staff.
    const firstName = meta.firstName.get(user.legacyId);
    const lastName = meta.lastName.get(user.legacyId);
    const phone = meta.phone.get(user.legacyId) || null;
    const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const displayName = sanitizeLegacyText(composedName || user.displayName || user.login || email.split('@')[0]);

    eligible.push({
      legacyId: user.legacyId,
      login: user.login,
      email,
      hash: user.hash,
      displayName: displayName || email.split('@')[0],
      firstName,
      lastName,
      phone,
      capabilityKeys: caps,
      mappedRole,
    });
  }

  return {
    filePath: absolutePath,
    totalUsers: users.length,
    eligibleStudents: eligible,
    skippedNonStudents,
    skippedUnsupportedHash,
    skippedInvalidEmail,
    duplicateEmailConflicts: detectDuplicateEmails(eligible),
    roleBreakdown,
  };
}

function inferTablePrefix(sql: string) {
  const match = sql.match(/CREATE TABLE `([^`]+)users`/);
  return match?.[1] || null;
}

function parseWpUsersRich(sql: string, prefix: string) {
  const table = `${prefix}users`;
  const users: Array<{
    legacyId: string;
    login: string;
    hash: string;
    email: string;
    displayName: string;
  }> = [];
  const insertRegex = new RegExp(`INSERT INTO \`${table}\`[^V]*VALUES\\s*([\\s\\S]*?);`, 'g');
  let insertMatch: RegExpExecArray | null;

  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    const values = insertMatch[1];
    const rowRegex =
      /\(\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\s*\)/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(values)) !== null) {
      users.push({
        legacyId: rowMatch[1],
        login: unescapeSqlString(rowMatch[2]),
        hash: unescapeSqlString(rowMatch[3]),
        email: unescapeSqlString(rowMatch[5]),
        displayName: unescapeSqlString(rowMatch[10]),
      });
    }
  }

  return users;
}

function parseUserMeta(sql: string, prefix: string) {
  const table = `${prefix}usermeta`;
  const capabilities = new Map<string, string[]>();
  const firstName = new Map<string, string>();
  const lastName = new Map<string, string>();
  const phone = new Map<string, string>();

  for (const values of extractInsertValueBlocks(sql, table)) {
    const rowRegex =
      /\(\s*\d+\s*,\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*\)/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(values)) !== null) {
      const userId = rowMatch[1];
      const key = unescapeSqlString(rowMatch[2]);
      const value = unescapeSqlString(rowMatch[3]);

      if (key === 'wp_capabilities' || key.endsWith('_capabilities')) {
        capabilities.set(userId, extractCapabilityKeys(value));
      } else if (key === 'first_name' && value.trim()) {
        firstName.set(userId, sanitizeLegacyText(value));
      } else if (key === 'last_name' && value.trim()) {
        lastName.set(userId, sanitizeLegacyText(value));
      } else if ((key === 'billing_phone' || key === 'phone') && value.trim()) {
        phone.set(userId, value.replace(/[^\d+]/g, ''));
      }
    }
  }

  return { capabilities, firstName, lastName, phone };
}

/** Extract INSERT ... VALUES blocks without truncating on `;` inside quoted strings. */
function extractInsertValueBlocks(sql: string, table: string): string[] {
  const marker = `INSERT INTO \`${table}\``;
  const blocks: string[] = [];
  let searchFrom = 0;

  while (searchFrom < sql.length) {
    const start = sql.indexOf(marker, searchFrom);
    if (start < 0) break;
    const valuesIdx = sql.indexOf('VALUES', start);
    if (valuesIdx < 0) break;

    let i = valuesIdx + 'VALUES'.length;
    let inString = false;
    for (; i < sql.length; i += 1) {
      const ch = sql[i];
      if (inString) {
        if (ch === '\\') {
          i += 1;
          continue;
        }
        if (ch === "'") inString = false;
      } else if (ch === "'") {
        inString = true;
      } else if (ch === ';') {
        break;
      }
    }

    blocks.push(sql.slice(valuesIdx + 'VALUES'.length, i));
    searchFrom = i + 1;
  }

  return blocks;
}

function extractCapabilityKeys(serialized: string): string[] {
  const keys: string[] = [];
  const pattern = /s:\d+:"([^"]+)";b:1/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(serialized)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function unescapeSqlString(value: string) {
  return value.replace(/\\'/g, "'").replace(/\\\\/g, '\\').replace(/\\"/g, '"');
}
