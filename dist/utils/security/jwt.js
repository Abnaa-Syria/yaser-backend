// backend/src/utils/security/jwt.ts
import jwt from 'jsonwebtoken';
/** Prefer JWT_SECRET; fall back to JWT_ACCESS_SECRET for .env.example compatibility. */
export const getJwtAccessSecret = () => (process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '');
export const getJwtRefreshSecret = () => (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '');
// =============================
// 1. إنشاء Token
// =============================
export const generateToken = ({ payload, expiresIn = process.env.JWT_EXPIRE || '1d', secret = getJwtAccessSecret(), }) => {
    // Always include a unique jti so identical payloads in the same second
    // never produce duplicate refresh tokens (unique DB constraint).
    const jti = payload.jti || cryptoRandomId();
    return jwt.sign({ ...payload, jti }, secret, { expiresIn });
};
function cryptoRandomId() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
// =============================
// 2. فك والتحقق من Token
// =============================
export const verifyToken = ({ token, secret = getJwtAccessSecret(), }) => {
    return jwt.verify(token, secret);
};
//# sourceMappingURL=jwt.js.map