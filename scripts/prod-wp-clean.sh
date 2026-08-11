#!/usr/bin/env bash
# Production clean reset: keep WP users (email/username/password), drop WP courses/enrollments.
# Run on the API host as root:
#   bash /tmp/prod-wp-clean.sh
set -euo pipefail

cd /var/www/api.alienparts.online

echo "==> Counts before"
node --input-type=module <<'NODE'
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const [users, students, courses, purchases, progress, maps] = await Promise.all([
  prisma.user.count(),
  prisma.user.count({ where: { role: { name: 'STUDENT' } } }),
  prisma.course.count(),
  prisma.coursePurchase.count(),
  prisma.lessonProgress.count(),
  prisma.legacyExternalIdMap.groupBy({ by: ['entityType'], _count: true }),
]);
console.log(JSON.stringify({ users, students, courses, purchases, progress, maps }, null, 2));
await prisma.$disconnect();
NODE

echo "==> Writing purge script"
mkdir -p prisma/migrations-data/wordpress
cat > prisma/migrations-data/wordpress/purge-wordpress-content.ts <<'TS'
import 'dotenv/config';
import { prisma } from '../../../src/prisma.js';

type Args = { dryRun: boolean; apply: boolean };
function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: true, apply: false };
  for (const arg of argv) {
    if (arg === '--apply') { args.apply = true; args.dryRun = false; }
    if (arg === '--dry-run') { args.dryRun = true; args.apply = false; }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.apply && process.env.ALLOW_LEGACY_CONTENT_PURGE !== 'true') {
    throw new Error('Set ALLOW_LEGACY_CONTENT_PURGE=true');
  }

  const courseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', entityType: 'Course' },
    select: { targetId: true },
  });
  const purchaseMaps = await prisma.legacyExternalIdMap.findMany({
    where: { source: 'WORDPRESS', entityType: 'CoursePurchase' },
    select: { targetId: true },
  });
  const userMapCount = await prisma.legacyExternalIdMap.count({
    where: { source: 'WORDPRESS', entityType: 'User' },
  });

  const courseIds = [...new Set(courseMaps.map((m) => m.targetId))];
  const purchaseIds = [...new Set(purchaseMaps.map((m) => m.targetId))];

  const summary = {
    dryRun: args.dryRun,
    keepUserMaps: userMapCount,
    courses: courseIds.length,
    purchases: purchaseIds.length,
  };
  if (args.dryRun) {
    console.log(JSON.stringify({ ...summary, note: 'dry-run' }, null, 2));
    return;
  }

  const deleted = { purchasesByMap: 0, courses: 0, maps: 0 };
  await prisma.$transaction(async (tx) => {
    if (purchaseIds.length) {
      deleted.purchasesByMap = (await tx.coursePurchase.deleteMany({ where: { id: { in: purchaseIds } } })).count;
    }
    if (courseIds.length) {
      deleted.courses = (await tx.course.deleteMany({ where: { id: { in: courseIds } } })).count;
    }
    deleted.maps = (await tx.legacyExternalIdMap.deleteMany({
      where: { source: 'WORDPRESS', entityType: { in: ['Course', 'Unit', 'Lesson', 'CoursePurchase'] } },
    })).count;
  }, { timeout: 120_000 });

  console.log(JSON.stringify({ ...summary, deleted }, null, 2));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
TS

echo "==> Purge dry-run"
npx tsx prisma/migrations-data/wordpress/purge-wordpress-content.ts --dry-run

echo "==> Purge apply"
ALLOW_LEGACY_CONTENT_PURGE=true npx tsx prisma/migrations-data/wordpress/purge-wordpress-content.ts --apply

echo "==> Clear phone + set fullName=username for WP-mapped students"
node --input-type=module <<'NODE'
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const maps = await prisma.legacyExternalIdMap.findMany({
  where: { source: 'WORDPRESS', entityType: 'User' },
  select: { targetId: true },
});
const ids = [...new Set(maps.map((m) => m.targetId))];
let updated = 0;
for (const id of ids) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, role: { select: { name: true } } },
  });
  if (!user || user.role.name !== 'STUDENT') continue;
  const fullName = (user.username || user.email.split('@')[0] || 'student').slice(0, 120);
  await prisma.user.update({
    where: { id },
    data: { phone: null, fullName },
  });
  updated += 1;
}
console.log(JSON.stringify({ mappedUsers: ids.length, studentsCleared: updated }, null, 2));
await prisma.$disconnect();
NODE

DUMP="/var/www/u450369734_GbsWr (3).sql"
if [[ -f "$DUMP" ]]; then
  echo "==> SQL dump found — identity resync passwords/usernames from WordPress"
  # Prefer repo script if present; otherwise skip detailed resync (users already imported).
  if [[ -f prisma/migrations-data/wordpress/import-wordpress-students.ts ]]; then
    ALLOW_LEGACY_STUDENT_IMPORT=true npx tsx prisma/migrations-data/wordpress/import-wordpress-students.ts --resync --source-sql "$DUMP" || true
  fi
else
  echo "==> No WordPress dump at $DUMP — kept existing password hashes; phones cleared."
fi

echo "==> Counts after"
node --input-type=module <<'NODE'
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const [users, students, courses, purchases, progress, maps] = await Promise.all([
  prisma.user.count(),
  prisma.user.count({ where: { role: { name: 'STUDENT' } } }),
  prisma.course.count(),
  prisma.coursePurchase.count(),
  prisma.lessonProgress.count(),
  prisma.legacyExternalIdMap.groupBy({ by: ['entityType'], _count: true }),
]);
console.log(JSON.stringify({ users, students, courses, purchases, progress, maps }, null, 2));
await prisma.$disconnect();
NODE

echo "DONE"
