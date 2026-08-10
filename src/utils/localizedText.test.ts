import { describe, expect, it } from 'vitest';
import { cleanLocalizedString, isCorruptedLocalizedText } from './localizedText.js';

describe('localizedText', () => {
  it('detects question-mark mojibake', () => {
    expect(isCorruptedLocalizedText('???? ?????')).toBe(true);
    expect(isCorruptedLocalizedText('جرّب ياسر USMLE مجاناً')).toBe(false);
  });

  it('falls back for corrupted values', () => {
    expect(cleanLocalizedString('????', 'fallback')).toBe('fallback');
    expect(cleanLocalizedString('نص عربي', 'fallback')).toBe('نص عربي');
  });
});
