import path from 'path';
import { analyzeWordPressDump } from './report.js';

type Args = {
  dryRun: boolean;
  apply: boolean;
  sourceSql: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: true,
    apply: false,
    sourceSql: path.resolve(process.cwd(), '..', 'u450369734_GbsWr (3).sql'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') {
      args.apply = true;
      args.dryRun = false;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
    }
    if (arg === '--source-sql') {
      args.sourceSql = path.resolve(argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const analysis = analyzeWordPressDump(args.sourceSql);

  if (args.apply && !process.env.LEGACY_DATABASE_URL) {
    throw new Error(
      'Apply mode requires LEGACY_DATABASE_URL pointing to a restored WordPress staging database. Refusing to import directly from SQL dump.'
    );
  }

  if (args.apply) {
    const { prisma } = await import('../../../src/prisma.js');
    const run = await prisma.legacyImportRun.create({
      data: {
        source: 'WORDPRESS',
        mode: 'APPLY',
        status: 'FAILED',
        sourceDescription: process.env.LEGACY_DATABASE_URL,
        options: { sourceSql: analysis.filePath },
        summary: {
          message:
            'Apply mode is intentionally blocked until source DB readers are configured. Dry-run analysis completed.',
          analysis,
        },
        usersRead: analysis.usersRead,
        usersSkipped: analysis.usersRead,
        conflictsCount: analysis.duplicateEmailConflicts + analysis.duplicatePhoneConflicts,
      },
    });
    console.log(JSON.stringify({ runId: run.id, applied: false, analysis }, null, 2));
    await prisma.$disconnect();
    return;
  }

  console.log(
    JSON.stringify(
      {
        mode: 'DRY_RUN',
        writes: 0,
        analysis,
        nextStep:
          'Restore the WordPress dump to a staging database, set LEGACY_DATABASE_URL, then implement/apply batch readers against that restored source.',
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
