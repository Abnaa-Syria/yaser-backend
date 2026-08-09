// backend/src/utils/security/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role?: string;
  jti?: string;
  [key: string]: any;
}

interface GenerateTokenArgs {
  payload: JwtPayload;
  expiresIn?: string | number;
  secret?: string;
}

interface VerifyTokenArgs {
  token: string;
  secret?: string;
}

/** Prefer JWT_SECRET; fall back to JWT_ACCESS_SECRET for .env.example compatibility. */
export const getJwtAccessSecret = (): string =>
  (process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '') as string;

export const getJwtRefreshSecret = (): string =>
  (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '') as string;

// =============================
// 1. إنشاء Token
// =============================
export const generateToken = ({
  payload,
  expiresIn = process.env.JWT_EXPIRE || '1d',
  secret = getJwtAccessSecret(),
}: GenerateTokenArgs): string => {
  // Always include a unique jti so identical payloads in the same second
  // never produce duplicate refresh tokens (unique DB constraint).
  const jti = payload.jti || cryptoRandomId();
  return jwt.sign({ ...payload, jti }, secret, { expiresIn } as SignOptions);
};

function cryptoRandomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

// =============================
// 2. فك والتحقق من Token
// =============================
export const verifyToken = ({
  token,
  secret = getJwtAccessSecret(),
}: VerifyTokenArgs): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};
