/**
 * WordPress → Yaser: students identity-only import / resync.
 *
 * Safe scope:
 * - Creates or refreshes STUDENT users from the legacy dump
 * - Writes ONLY email + username + password hash (plus required fullName placeholder)
 * - Clears phone / does not carry WP display names or other profile fields
 * - Never overwrites platform owner / staff accounts
 * - Does NOT import courses, enrollments, quizzes, media, or payments
 *
 * Usage:
 *   npm run legacy:wp:students:dry-run
 *   $env:ALLOW_LEGACY_STUDENT_IMPORT="true"; npm run legacy:wp:students:apply
 *   $env:ALLOW_LEGACY_STUDENT_IMPORT="true"; npm run legacy:wp:students:resync
 */
import 'dotenv/config';
import path from 'path';
import { prisma } from '../../../src/prisma.js';
import { getRoleIdByName } from '../../../src/utils/role-query.js';
import { allocateUniqueUsername, usernameFromIdentity } from '../../../src/utils/username.js';
import { buildStudentImportPlan } from './parse-students.js';

type Args = {
  dryRun: boolean;
  apply: boolean;
  resync: boolean;
  sourceSql: string;
  limit?: number;
};

const PROTECTED_EMAIL_PREFIXES = [
  'dr.yaser@',
  'admin@',
  'superadmin@',
  'finance@',
  'support@',
  'ta@',
  'reviewer@',
];

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CONTENT_REVIEWER', 'FINANCE', 'SUPPORT', 'TEACHING_ASSISTANT']);

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: true,
    apply: false,
    resync: false,
    sourceSql: path.resolve(process.cwd(), '..', 'u450369734_GbsWr (3).sql'),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      args.apply = true;
      args.dryRun = false;
    }
    if (arg === '--resync') {
      args.apply = true;
      args.resync = true;
      args.dryRun = false;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
      args.resync = false;
    }
    if (arg === '--source-sql') {
      args.sourceSql = path.resolve(argv[i + 1]);
      i += 1;
    }
    if (arg === '--limit') {
      args.limit = Math.max(1, Number(argv[i + 1]) || 0) || undefined;
      i += 1;
    }
  }
  return args;
}

function isProtectedEmail(email: string) {
  return PROTECTED_EMAIL_PREFIXES.some((prefix) => email.startsWith(prefix));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  // Full re-import: always refresh existing mapped/student rows unless dry-run.
  const resync = args.resync || args.apply;
  const plan = buildStudentImportPlan(args.sourceSql);
  const candidates = args.limit ? plan.eligibleStudents.slice(0, args.limit) : plan.eligibleStudents;

  if ((args.apply || args.resync) && process.env.ALLOW_LEGACY_STUDENT_IMPORT !== 'true') {
    throw new Error(
      'Refusing apply/resync. Set ALLOW_LEGACY_STUDENT_IMPORT=true to write students from the WordPress dump.'
    );
  }

  const existingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      password: true,
      legacyPasswordRehashedAt: true,
      role: { select: { name: true } },
    },
  });
  const existingByEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));
  const existingById = new Map(existingUsers.map((u) => [u.id, u]));
  const existingByUsername = new Map(
    existingUsers.filter((u) => u.username).map((u) => [String(u.username).toLowerCase(), u])
  );

  const existingMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', sourceTable: 'wp_users', entityType: 'User' },
    select: { id: true, legacyId: true, targetId: true },
  });
  const mapByLegacyId = new Map(existingMaps.map((m) => [m.legacyId, m]));

  let wouldCreate = 0;
  let wouldUpdate = 0;
  let wouldSkipProtected = 0;
  let wouldSkipStaffEmail = 0;
  let wouldSkipConflict = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const conflictSamples: Array<{ type: string; legacyId: string; emailHash: string }> = [];

  const studentRoleId = args.apply || args.resync ? await getRoleIdByName('STUDENT') : null;

  const run = await prisma.legacyImportRun.create({
    data: {
      source: 'WORDPRESS',
      mode: args.dryRun ? 'DRY_RUN_STUDENTS' : resync ? 'RESYNC_STUDENTS' : 'APPLY_STUDENTS',
      status: args.dryRun ? 'DRY_RUN' : 'RUNNING',
      sourceDescription: plan.filePath,
      options: {
        studentsOnly: true,
        identityOnly: true,
        resync,
        limit: args.limit ?? null,
        roleBreakdown: plan.roleBreakdown,
      },
      usersRead: plan.totalUsers,
      summary: {
        eligible: plan.eligibleStudents.length,
        skippedNonStudents: plan.skippedNonStudents,
        skippedUnsupportedHash: plan.skippedUnsupportedHash,
        skippedInvalidEmail: plan.skippedInvalidEmail,
        duplicateEmailConflicts: plan.duplicateEmailConflicts.length,
      },
    },
  });

  try {
    for (const student of candidates) {
      const emailHash = hashForReport(student.email);
      const mapped = mapByLegacyId.get(student.legacyId);
      const existingByLegacy = mapped ? existingById.get(mapped.targetId) : null;
      const existingByMail = existingByEmail.get(student.email);

      if (isProtectedEmail(student.email) || (existingByLegacy && isProtectedEmail(existingByLegacy.email))) {
        wouldSkipProtected += 1;
        skipped += 1;
        conflictSamples.push({ type: 'PROTECTED_EMAIL', legacyId: student.legacyId, emailHash });
        if (!args.dryRun) {
          await prisma.legacyImportConflict.create({
            data: {
              runId: run.id,
              sourceTable: 'wp_users',
              legacyId: student.legacyId,
              entityType: 'User',
              conflictType: 'PROTECTED_EMAIL',
              severity: 'BLOCKER',
              message: `Skipped protected platform email (${emailHash}).`,
            },
          });
        }
        continue;
      }

      // Prefer identity by legacy map (full resync of previously imported students).
      if (existingByLegacy) {
        if (STAFF_ROLES.has(existingByLegacy.role.name)) {
          wouldSkipStaffEmail += 1;
          skipped += 1;
          continue;
        }

        const emailOwner = existingByEmail.get(student.email);
        if (emailOwner && emailOwner.id !== existingByLegacy.id) {
          wouldSkipConflict += 1;
          skipped += 1;
          conflictSamples.push({ type: 'EMAIL_TAKEN_BY_OTHER', legacyId: student.legacyId, emailHash });
          if (!args.dryRun) {
            await prisma.legacyImportConflict.create({
              data: {
                runId: run.id,
                sourceTable: 'wp_users',
                legacyId: student.legacyId,
                entityType: 'User',
                conflictType: 'EMAIL_TAKEN_BY_OTHER',
                severity: 'BLOCKER',
                message: `Cannot refresh legacy user; email already belongs to another app user.`,
                payload: { targetUserId: existingByLegacy.id, emailOwnerId: emailOwner.id },
              },
            });
          }
          continue;
        }

        wouldUpdate += 1;
        if (args.dryRun || !resync) continue;

        const oldEmail = existingByLegacy.email.toLowerCase();
        const username = await allocateUniqueUsername(
          usernameFromIdentity({
            login: student.login,
            email: student.email,
          }),
          { excludeUserId: existingByLegacy.id }
        );
        const keepNativePassword = Boolean(existingByLegacy.legacyPasswordRehashedAt);
        const fullName = username.slice(0, 120);
        await prisma.user.update({
          where: { id: existingByLegacy.id },
          data: {
            email: student.email,
            username,
            fullName,
            phone: null,
            ...(keepNativePassword
              ? {}
              : { password: student.hash, legacyPasswordRehashedAt: null }),
            isActive: true,
          },
        });

        await prisma.legacyExternalIdMap.update({
          where: { id: mapped!.id },
          data: {
            runId: run.id,
            metadata: {
              login: student.login,
              username,
              identityOnly: true,
              refreshedAt: new Date().toISOString(),
            },
          },
        });

        if (oldEmail !== student.email) {
          existingByEmail.delete(oldEmail);
        }
        if (existingByLegacy.username) {
          existingByUsername.delete(String(existingByLegacy.username).toLowerCase());
        }
        const refreshed = {
          ...existingByLegacy,
          email: student.email,
          username,
          fullName,
          phone: null,
          password: keepNativePassword ? existingByLegacy.password : student.hash,
        };
        existingByEmail.set(student.email, refreshed);
        existingById.set(existingByLegacy.id, refreshed);
        existingByUsername.set(username, refreshed);
        updated += 1;
        continue;
      }

      if (existingByMail) {
        if (STAFF_ROLES.has(existingByMail.role.name) || existingByMail.role.name !== 'STUDENT') {
          wouldSkipStaffEmail += 1;
          skipped += 1;
          conflictSamples.push({ type: 'EMAIL_EXISTS_STAFF', legacyId: student.legacyId, emailHash });
          if (!args.dryRun) {
            await prisma.legacyImportConflict.create({
              data: {
                runId: run.id,
                sourceTable: 'wp_users',
                legacyId: student.legacyId,
                entityType: 'User',
                conflictType: 'EMAIL_EXISTS_STAFF',
                severity: 'BLOCKER',
                message: `Email exists as ${existingByMail.role.name}; not overwritten.`,
                payload: { targetUserId: existingByMail.id, role: existingByMail.role.name },
              },
            });
          }
          continue;
        }

        // Same email student without legacy map → attach map + refresh.
        wouldUpdate += 1;
        if (args.dryRun || !resync) continue;

        const username = await allocateUniqueUsername(
          usernameFromIdentity({
            login: student.login,
            email: student.email,
          }),
          { excludeUserId: existingByMail.id }
        );
        const keepNativePassword = Boolean(existingByMail.legacyPasswordRehashedAt);
        const fullName = username.slice(0, 120);
        await prisma.user.update({
          where: { id: existingByMail.id },
          data: {
            username,
            fullName,
            phone: null,
            ...(keepNativePassword
              ? {}
              : { password: student.hash, legacyPasswordRehashedAt: null }),
            isActive: true,
          },
        });

        const map = await prisma.legacyExternalIdMap.create({
          data: {
            runId: run.id,
            source: 'WORDPRESS',
            sourceTable: 'wp_users',
            legacyId: student.legacyId,
            entityType: 'User',
            targetId: existingByMail.id,
            metadata: {
              login: student.login,
              username,
              identityOnly: true,
              linkedOnResync: true,
            },
          },
        });
        mapByLegacyId.set(student.legacyId, map);
        updated += 1;
        continue;
      }

      wouldCreate += 1;
      if (args.dryRun || !studentRoleId) continue;

      const username = await allocateUniqueUsername(
        usernameFromIdentity({
          login: student.login,
          email: student.email,
        })
      );
      const fullName = username.slice(0, 120);
      const createdUser = await prisma.user.create({
        data: {
          email: student.email,
          username,
          password: student.hash,
          fullName,
          phone: null,
          roleId: studentRoleId,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });

      const map = await prisma.legacyExternalIdMap.create({
        data: {
          runId: run.id,
          source: 'WORDPRESS',
          sourceTable: 'wp_users',
          legacyId: student.legacyId,
          entityType: 'User',
          targetId: createdUser.id,
          metadata: {
            login: student.login,
            username,
            identityOnly: true,
          },
        },
      });

      const row = {
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        fullName: createdUser.fullName,
        phone: createdUser.phone,
        password: createdUser.password,
        legacyPasswordRehashedAt: null,
        role: { name: 'STUDENT' },
      };
      existingByEmail.set(student.email, row);
      existingById.set(createdUser.id, row);
      existingByUsername.set(username, row);
      mapByLegacyId.set(student.legacyId, map);
      created += 1;
    }

    const summary = {
      studentsOnly: true,
      identityOnly: true,
      resync,
      dryRun: args.dryRun,
      totalUsersInDump: plan.totalUsers,
      roleBreakdown: plan.roleBreakdown,
      eligibleStudents: plan.eligibleStudents.length,
      considered: candidates.length,
      wouldCreate,
      wouldUpdate,
      wouldSkipProtected,
      wouldSkipStaffEmail,
      wouldSkipConflict,
      created,
      updated,
      skipped,
      skippedNonStudents: plan.skippedNonStudents,
      skippedUnsupportedHash: plan.skippedUnsupportedHash,
      skippedInvalidEmail: plan.skippedInvalidEmail,
      duplicateEmailConflicts: plan.duplicateEmailConflicts.length,
      conflictSamples: conflictSamples.slice(0, 20),
      note: args.dryRun
        ? 'Dry-run only. Re-run with --resync and ALLOW_LEGACY_STUDENT_IMPORT=true to refresh email/username/password only.'
        : 'Identity-only student resync: email + username + password hash (fullName=username placeholder; phone cleared).',
    };

    await prisma.legacyImportRun.update({
      where: { id: run.id },
      data: {
        status: args.dryRun ? 'DRY_RUN' : 'COMPLETED',
        finishedAt: new Date(),
        usersImported: created + updated,
        usersSkipped: skipped + plan.skippedNonStudents + plan.skippedUnsupportedHash + plan.skippedInvalidEmail,
        conflictsCount: conflictSamples.length + plan.duplicateEmailConflicts.length,
        summary,
      },
    });

    console.log(JSON.stringify({ runId: run.id, ...summary }, null, 2));
  } catch (error) {
    await prisma.legacyImportRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        failuresCount: 1,
        errorLog: { message: error instanceof Error ? error.message : String(error) },
      },
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function hashForReport(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
