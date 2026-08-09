// backend/src/utils/security/jwt.ts
import jwt from 'jsonwebtoken';
// =============================
// 1. إنشاء Token
// =============================
export const generateToken = ({ payload, expiresIn = process.env.JWT_EXPIRE || '1d', secret = process.env.JWT_SECRET, }) => {
    return jwt.sign(payload, secret, { expiresIn });
};
// =============================
// 2. فك والتحقق من Token
// =============================
export const verifyToken = ({ token, secret = process.env.JWT_SECRET, }) => {
    return jwt.verify(token, secret);
};
//# sourceMappingURL=jwt.js.map