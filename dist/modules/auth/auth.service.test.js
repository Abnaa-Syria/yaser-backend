import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { wordpressPasswordInput } from '../../utils/security/hash.js';
const mocks = vi.hoisted(() => ({
    userFindFirst: vi.fn(),
    userUpdate: vi.fn(),
    refreshTokenCreate: vi.fn(),
    transaction: vi.fn(),
    createUserSession: vi.fn(),
    generateToken: vi.fn(),
}));
vi.mock('../../prisma.js', () => ({
    prisma: {
        user: {
            findFirst: mocks.userFindFirst,
            update: mocks.userUpdate,
        },
        refreshToken: {
            create: mocks.refreshTokenCreate,
        },
        $transaction: mocks.transaction,
    },
}));
vi.mock('../../services/session.service.js', () => ({
    createUserSession: mocks.createUserSession,
    deactivateAllUserSessions: vi.fn(),
}));
vi.mock('../../utils/security/jwt.js', () => ({
    generateToken: mocks.generateToken,
    verifyToken: vi.fn(),
    getJwtRefreshSecret: () => 'test-refresh-secret',
}));
const { loginUser } = await import('./auth.service.js');
describe('auth login legacy continuity', () => {
    beforeEach(() => {
        Object.values(mocks).forEach((mock) => mock.mockReset());
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
        mocks.createUserSession.mockResolvedValue('session-1');
        mocks.generateToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
        mocks.userUpdate.mockResolvedValue({});
        mocks.refreshTokenCreate.mockResolvedValue({});
        mocks.transaction.mockImplementation(async (operations) => Promise.all(operations));
    });
    it('accepts a WordPress hash and rehashes it to native bcrypt', async () => {
        const password = 'legacy user password';
        const bcryptHash = await bcrypt.hash(wordpressPasswordInput(password), 10);
        const legacyHash = `$wp${bcryptHash.replace('$2b$', '$2y$')}`;
        mocks.userFindFirst.mockResolvedValue({
            id: 'user-1',
            email: 'student@example.com',
            fullName: 'Legacy Student',
            password: legacyHash,
            isActive: true,
            role: { name: 'STUDENT', permissions: [] },
            userPermissions: [],
        });
        const result = await loginUser({
            identifier: 'student@example.com',
            password,
        });
        expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        expect(mocks.userUpdate).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-1' },
            data: expect.objectContaining({
                password: expect.not.stringContaining('$wp$'),
                legacyPasswordRehashedAt: expect.any(Date),
            }),
        }));
    });
    it('does not rehash after a failed legacy password check', async () => {
        const bcryptHash = await bcrypt.hash(wordpressPasswordInput('right password'), 10);
        const legacyHash = `$wp${bcryptHash.replace('$2b$', '$2y$')}`;
        mocks.userFindFirst.mockResolvedValue({
            id: 'user-1',
            email: 'student@example.com',
            fullName: 'Legacy Student',
            password: legacyHash,
            isActive: true,
            role: { name: 'STUDENT', permissions: [] },
            userPermissions: [],
        });
        await expect(loginUser({ identifier: 'student@example.com', password: 'wrong password' })).rejects.toThrow('Invalid email/username or password.');
        expect(mocks.userUpdate).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=auth.service.test.js.map