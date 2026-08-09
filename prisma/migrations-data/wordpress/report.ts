import fs from 'fs';
import path from 'path';
import { detectDuplicateEmails, detectDuplicatePhones, LegacyUserIdentity } from './conflicts.js';

export type DumpAnalysis = {
  filePath: string;
  tablePrefix: string | null;
  usersRead: number;
  wordpressBcryptHashes: number;
  unsupportedHashSamples: string[];
  duplicateEmailConflicts: number;
  duplicatePhoneConflicts: number;
  coursePostCount: number;
  lessonPostCount: number;
  quizPostCount: number;
  questionPostCount: number;
  lmsUserCourseRows: number;
  lmsUserLessonRows: number;
};

const POST_TYPE_PATTERNS = {
  coursePostCount: /'stm-courses'/g,
  lessonPostCount: /'stm-lessons'/g,
  quizPostCount: /'stm-quizzes'/g,
  questionPostCount: /'stm-questions'/g,
};

export function analyzeWordPressDump(filePath: string): DumpAnalysis {
  const absolutePath = path.resolve(filePath);
  const sql = fs.readFileSync(absolutePath, 'utf8');
  const tablePrefix = inferTablePrefix(sql);
  const users = parseWpUsers(sql, tablePrefix || 'wp_');
  const hashValues = users.map((user) => user.hash).filter(Boolean);
  const unsupportedHashSamples = [...new Set(hashValues.filter((hash) => !hash.startsWith('$wp$2y$')))]
    .slice(0, 5)
    .map((hash) => `${hash.slice(0, 8)}...`);
  const duplicateEmailConflicts = detectDuplicateEmails(users).length;
  const duplicatePhoneConflicts = detectDuplicatePhones(users).length;

  return {
    filePath: absolutePath,
    tablePrefix,
    usersRead: users.length,
    wordpressBcryptHashes: hashValues.filter((hash) => hash.startsWith('$wp$2y$')).length,
    unsupportedHashSamples,
    duplicateEmailConflicts,
    duplicatePhoneConflicts,
    coursePostCount: countMatches(sql, POST_TYPE_PATTERNS.coursePostCount),
    lessonPostCount: countMatches(sql, POST_TYPE_PATTERNS.lessonPostCount),
    quizPostCount: countMatches(sql, POST_TYPE_PATTERNS.quizPostCount),
    questionPostCount: countMatches(sql, POST_TYPE_PATTERNS.questionPostCount),
    lmsUserCourseRows: countInsertTuples(sql, `${tablePrefix || 'wp_'}stm_lms_user_courses`),
    lmsUserLessonRows: countInsertTuples(sql, `${tablePrefix || 'wp_'}stm_lms_user_lessons`),
  };
}

function inferTablePrefix(sql: string) {
  const match = sql.match(/CREATE TABLE `([^`]+)users`/);
  return match?.[1] || null;
}

function parseWpUsers(sql: string, prefix: string): (LegacyUserIdentity & { hash: string })[] {
  const table = `${prefix}users`;
  const users: (LegacyUserIdentity & { hash: string })[] = [];
  const insertRegex = new RegExp(`INSERT INTO \`${table}\`[^V]*VALUES\\s*([\\s\\S]*?);`, 'g');
  let insertMatch: RegExpExecArray | null;

  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    const values = insertMatch[1];
    const rowRegex =
      /\(\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(values)) !== null) {
      users.push({
        legacyId: rowMatch[1],
        email: unescapeSqlString(rowMatch[5]),
        hash: unescapeSqlString(rowMatch[3]),
      });
    }
  }

  return users;
}

function unescapeSqlString(value: string) {
  return value.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function countMatches(sql: string, pattern: RegExp) {
  return sql.match(pattern)?.length || 0;
}

function countInsertTuples(sql: string, table: string) {
  const insertRegex = new RegExp(`INSERT INTO \`${table}\`[^V]*VALUES\\s*([\\s\\S]*?);`, 'g');
  let total = 0;
  let insertMatch: RegExpExecArray | null;
  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    total += insertMatch[1].match(/\(/g)?.length || 0;
  }
  return total;
}
