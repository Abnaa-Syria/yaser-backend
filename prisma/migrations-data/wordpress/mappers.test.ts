import { describe, expect, it } from 'vitest';
import { mapLegacyRole, normalizeLegacyEmail, sanitizeLegacyText } from './mappers.js';

describe('WordPress migration mappers', () => {
  it('normalizes identity fields safely', () => {
    expect(normalizeLegacyEmail(' Student@Example.COM ')).toBe('student@example.com');
    expect(sanitizeLegacyText('<script>alert(1)</script><b>Yaser</b> USMLE')).toBe('Yaser USMLE');
  });

  it('maps roles conservatively', () => {
    expect(mapLegacyRole(['administrator'])).toBe('ADMIN');
    expect(mapLegacyRole(['stm_lms_instructor'])).toBe('INSTRUCTOR');
    expect(mapLegacyRole(['customer'])).toBe('STUDENT');
    expect(mapLegacyRole(['editor'], 0)).toBe('CONFLICT');
    expect(mapLegacyRole(['editor'], 2)).toBe('INSTRUCTOR');
  });
});
