import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(here, '..', 'seed.ts');
const schemaPath = resolve(here, '..', 'schema.prisma');
const [seed, schema] = await Promise.all([
  readFile(seedPath, 'utf8'),
  readFile(schemaPath, 'utf8'),
]);
const activeSeed = seed.split('/* REMOVED_LEGACY_SEED')[0];

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

requireText(activeSeed, "process.env.NODE_ENV === 'production'", 'production guard');
requireText(activeSeed, "process.env.ALLOW_DESTRUCTIVE_SEED !== 'true'", 'explicit destructive-seed authorization');
requireText(activeSeed, 'finally {', 'foreign-key restoration finally block');
requireText(activeSeed, 'assertSeedIntegrity()', 'post-seed integrity validation');
requireText(activeSeed, "correctAnswer: 'opt-a'", 'stable MCQ answer id');
requireText(activeSeed, "correctAnswer: 'true'", 'stable true/false answer id');
requireText(activeSeed, 'platform owner IS the instructor', 'owner-instructor product model');
requireText(activeSeed, 'dr.yaser@yaserusmle.com', 'primary owner email');
requireText(activeSeed, "roleId: roles.SUPER_ADMIN", 'owner is SUPER_ADMIN');
requireText(schema, 'enum LearningResourceType', 'medical learning resource enum');
requireText(schema, 'resourceType   LearningResourceType', 'learning resource relation');

const prohibited = [
  /\bEngineeringResourceType\b/i,
  /\bCAD_MODEL\b/i,
  /\bSCHEMATIC\b/i,
  /engineeringpioneers/i,
  /cdn\.example\.com/i,
  /structural engineering/i,
  /geotechnical/i,
  /reinforced concrete/i,
  /dr\.sara@yaserusmle\.com/i,
  /dr\.karim@yaserusmle\.com/i,
];
for (const pattern of prohibited) {
  if (pattern.test(activeSeed) || pattern.test(schema)) {
    failures.push(`Prohibited multi-instructor/legacy term matched ${pattern}.`);
  }
}

const courseFixtureSource = activeSeed
  .split('const courseFixtures: CourseFixture[] = [')[1]
  ?.split('function assertDestructiveSeedAllowed')[0] ?? '';
const courseFixtureCount = (courseFixtureSource.match(/slug: 'step-1-/g) ?? []).length;
if (courseFixtureCount < 8) {
  failures.push(`Expected at least 8 Step 1 course fixtures; found ${courseFixtureCount}.`);
}
if (!activeSeed.includes("const DEMO_ORIGIN = ''") && !activeSeed.includes('const DEMO_ORIGIN = ""')) {
  failures.push('DEMO_ORIGIN should be empty (legacy demo host no longer resolves).');
}
if (!activeSeed.includes("const instructors = [platformOwner]")) {
  failures.push('Expected a single platformOwner instructor array.');
}

if (failures.length) {
  console.error('Seed validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Seed validation passed (${courseFixtureCount} Step 1 courses, owner=instructor). No database was modified.`);
}
