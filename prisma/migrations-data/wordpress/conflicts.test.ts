import { describe, expect, it } from 'vitest';
import { detectDuplicateEmails, detectDuplicatePhones } from './conflicts.js';

describe('WordPress migration conflicts', () => {
  it('detects duplicate emails without returning raw email addresses', () => {
    const conflicts = detectDuplicateEmails([
      { legacyId: '1', email: 'Student@example.com' },
      { legacyId: '2', email: ' student@example.com ' },
      { legacyId: '3', email: 'other@example.com' },
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].conflictType).toBe('DUPLICATE_EMAIL');
    expect(conflicts[0].message).not.toContain('student@example.com');
    expect(conflicts[0].legacyId).toBe('1,2');
  });

  it('detects duplicate normalized phone numbers as review conflicts', () => {
    const conflicts = detectDuplicatePhones([
      { legacyId: '1', email: 'a@example.com', phone: '+1 555 111' },
      { legacyId: '2', email: 'b@example.com', phone: '+1555111' },
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].severity).toBe('REVIEW');
    expect(conflicts[0].message).not.toContain('+1555111');
  });
});
