import fs from 'fs';
import path from 'path';
import { inferTablePrefix, iterateInsertTuples } from './sql-parse.js';

export type ParsedUserCourse = {
  legacyId: string;
  userLegacyId: string;
  courseLegacyId: string;
  progressPercent: number;
  status: string;
  startTimeUnix: number;
  endTimeUnix: number;
};

export type ParsedUserLesson = {
  legacyId: string;
  userLegacyId: string;
  courseLegacyId: string;
  lessonLegacyId: string;
  startTimeUnix: number | null;
  endTimeUnix: number | null;
};

export type EnrollmentImportPlan = {
  filePath: string;
  userCourses: ParsedUserCourse[];
  userLessons: ParsedUserLesson[];
  statusBreakdown: Record<string, number>;
  uniqueUserCoursePairs: number;
  duplicateUserCourseRows: number;
};

function unixToDate(unix: number | null | undefined): Date | null {
  if (!unix || !Number.isFinite(unix) || unix <= 0) return null;
  return new Date(unix * 1000);
}

export { unixToDate };

export function buildEnrollmentImportPlan(filePath: string): EnrollmentImportPlan {
  const absolutePath = path.resolve(filePath);
  const sql = fs.readFileSync(absolutePath, 'utf8');
  const prefix = inferTablePrefix(sql);

  const userCourses: ParsedUserCourse[] = [];
  const statusBreakdown: Record<string, number> = {};
  const pairKeys = new Set<string>();
  let duplicateUserCourseRows = 0;

  for (const row of iterateInsertTuples(sql, `${prefix}stm_lms_user_courses`)) {
    if (row.length < 15) continue;
    const userLegacyId = String(row[1]);
    const courseLegacyId = String(row[2]);
    const status = String(row[6] || 'enrolled').toLowerCase();
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

    const pair = `${userLegacyId}:${courseLegacyId}`;
    if (pairKeys.has(pair)) {
      duplicateUserCourseRows += 1;
      continue;
    }
    pairKeys.add(pair);

    userCourses.push({
      legacyId: String(row[0]),
      userLegacyId,
      courseLegacyId,
      progressPercent: Number(row[4]) || 0,
      status,
      startTimeUnix: Number(row[12]) || 0,
      endTimeUnix: Number(row[13]) || 0,
    });
  }

  const userLessons: ParsedUserLesson[] = [];
  for (const row of iterateInsertTuples(sql, `${prefix}stm_lms_user_lessons`)) {
    if (row.length < 7) continue;
    userLessons.push({
      legacyId: String(row[0]),
      userLegacyId: String(row[1]),
      courseLegacyId: String(row[2]),
      lessonLegacyId: String(row[3]),
      startTimeUnix: row[5] == null ? null : Number(row[5]) || null,
      endTimeUnix: row[6] == null ? null : Number(row[6]) || null,
    });
  }

  return {
    filePath: absolutePath,
    userCourses,
    userLessons,
    statusBreakdown,
    uniqueUserCoursePairs: userCourses.length,
    duplicateUserCourseRows,
  };
}
