import { describe, expect, it } from 'vitest';
import { mapLegacyRole } from './mappers.js';
import { buildStudentImportPlan } from './parse-students.js';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dumpPath = path.resolve(here, '../../../../u450369734_GbsWr (3).sql');

describe('students-only WordPress plan', () => {
  it('maps only customer/subscriber as students', () => {
    expect(mapLegacyRole(['customer'])).toBe('STUDENT');
    expect(mapLegacyRole(['subscriber'])).toBe('STUDENT');
    expect(mapLegacyRole(['administrator'])).not.toBe('STUDENT');
    expect(mapLegacyRole(['stm_lms_instructor'])).not.toBe('STUDENT');
  });

  it('builds a student plan from the dump without writing', () => {
    const plan = buildStudentImportPlan(dumpPath);
    expect(plan.totalUsers).toBeGreaterThan(1000);
    expect(plan.eligibleStudents.length).toBe(plan.totalUsers);
    expect(plan.eligibleStudents.every((s) => s.hash.startsWith('$wp$'))).toBe(true);
    expect(plan.duplicateEmailConflicts.length).toBe(0);
    expect(plan.eligibleStudents.some((s) => s.email === 'mohammed.alammar20@gmail.com')).toBe(true);
  });
});
