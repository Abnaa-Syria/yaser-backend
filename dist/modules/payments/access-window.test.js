import { describe, expect, it } from 'vitest';
import { calculateAccessExpiresAt, durationDaysFromParts } from './access-window.js';
describe('access window helpers', () => {
    it('calculates duration days from explicit legacy durationDays first', () => {
        expect(durationDaysFromParts(120, 6, 'MONTH')).toBe(120);
    });
    it('converts structured duration units', () => {
        expect(durationDaysFromParts(null, 3, 'MONTH')).toBe(90);
        expect(durationDaysFromParts(null, 1, 'YEAR')).toBe(365);
        expect(durationDaysFromParts(null, 2, 'WEEK')).toBe(14);
    });
    it('treats lifetime access as no expiry', () => {
        expect(durationDaysFromParts(null, 1, 'LIFETIME')).toBeNull();
        expect(calculateAccessExpiresAt(new Date('2026-01-01T00:00:00Z'), null)).toBeNull();
    });
    it('calculates expiry from access start', () => {
        expect(calculateAccessExpiresAt(new Date('2026-01-01T00:00:00Z'), 30)?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    });
});
//# sourceMappingURL=access-window.test.js.map