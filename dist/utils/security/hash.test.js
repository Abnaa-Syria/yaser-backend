import bcrypt from 'bcrypt';
import { describe, expect, it } from 'vitest';
import { comparePassword, compareWordPressPassword, hashPassword, isWordPressBcryptHash, verifyPassword, wordpressPasswordInput, } from './hash.js';
describe('password hashing', () => {
    it('verifies native bcrypt passwords', async () => {
        const hash = await hashPassword('correct horse battery staple');
        await expect(comparePassword('correct horse battery staple', hash)).resolves.toBe(true);
        await expect(comparePassword('wrong password', hash)).resolves.toBe(false);
    });
    it('verifies WordPress prefixed bcrypt and marks it for rehash', async () => {
        const password = 'legacy password 123';
        const wordpressInput = wordpressPasswordInput(password);
        const bcryptHash = await bcrypt.hash(wordpressInput, 10);
        const legacyHash = `$wp${bcryptHash.replace('$2b$', '$2y$')}`;
        expect(isWordPressBcryptHash(legacyHash)).toBe(true);
        await expect(compareWordPressPassword(password, legacyHash)).resolves.toBe(true);
        await expect(compareWordPressPassword('wrong password', legacyHash)).resolves.toBe(false);
        const result = await verifyPassword(password, legacyHash);
        expect(result).toEqual({ valid: true, needsRehash: true });
    });
});
//# sourceMappingURL=hash.test.js.map