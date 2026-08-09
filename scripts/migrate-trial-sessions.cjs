const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM trial_sessions');
  const names = new Set(cols.map((c) => c.Field));
  const run = (sql) => prisma.$executeRawUnsafe(sql);

  await run(
    "UPDATE trial_sessions SET fingerprint = CONCAT('legacy-', id) WHERE fingerprint IS NULL OR fingerprint = ''"
  );
  await run('ALTER TABLE trial_sessions MODIFY fingerprint VARCHAR(191) NOT NULL');

  if (!names.has('deviceName')) await run('ALTER TABLE trial_sessions ADD COLUMN deviceName VARCHAR(191) NULL');
  if (!names.has('os')) await run('ALTER TABLE trial_sessions ADD COLUMN os VARCHAR(191) NULL');
  if (!names.has('ipAddress')) await run('ALTER TABLE trial_sessions ADD COLUMN ipAddress VARCHAR(191) NULL');
  if (!names.has('lastSeenAt')) {
    await run(
      'ALTER TABLE trial_sessions ADD COLUMN lastSeenAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)'
    );
  }
  if (!names.has('revokedAt')) await run('ALTER TABLE trial_sessions ADD COLUMN revokedAt DATETIME(3) NULL');
  if (!names.has('revokeReason')) await run('ALTER TABLE trial_sessions ADD COLUMN revokeReason TEXT NULL');
  if (!names.has('updatedAt')) {
    await run(
      'ALTER TABLE trial_sessions ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)'
    );
  }

  const ensureIndex = async (name, sql) => {
    const idx = await prisma.$queryRawUnsafe(`SHOW INDEX FROM trial_sessions WHERE Key_name = '${name}'`);
    if (!idx.length) {
      try {
        await run(sql);
      } catch (e) {
        console.log('index skip', name, e.message);
      }
    }
  };

  await ensureIndex(
    'trial_sessions_fingerprint_key',
    'CREATE UNIQUE INDEX trial_sessions_fingerprint_key ON trial_sessions(fingerprint)'
  );
  await ensureIndex(
    'trial_sessions_revokedAt_idx',
    'CREATE INDEX trial_sessions_revokedAt_idx ON trial_sessions(revokedAt)'
  );
  await ensureIndex(
    'trial_sessions_lastSeenAt_idx',
    'CREATE INDEX trial_sessions_lastSeenAt_idx ON trial_sessions(lastSeenAt)'
  );

  console.log('trial_sessions migrated');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
