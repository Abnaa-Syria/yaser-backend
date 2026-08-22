import crypto from 'crypto';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { APP_BRAND } from '../../config/brand.config.js';
import { hashPassword, comparePassword, verifyPassword } from '../../utils/security/hash.js';
import { generateToken, verifyToken, JwtPayload, getJwtRefreshSecret } from '../../utils/security/jwt.js';
import { createUserSession, deactivateAllUserSessions } from '../../services/session.service.js';
import { RegisterInput, LoginInput } from './auth.validation.js';
import { sendTemplatedEmail } from '../../utils/mail.js';
import { allocateUniqueUsername, usernameFromIdentity, normalizeUsername } from '../../utils/username.js';

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

const getStudentRoleId = async () => {
  const role = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  if (!role) throw new AppError('STUDENT role is not configured.', 500);
  return role.id;
};

const generateAuthTokens = (userId: string, roleName: string) => {
  const accessToken = generateToken({
    payload: { userId, role: roleName },
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });

  const refreshToken = generateToken({
    payload: { userId },
    expiresIn: '7d',
    secret: getJwtRefreshSecret(),
  });

  return { accessToken, refreshToken };
};

const persistRefreshToken = async (
  userId: string,
  refreshToken: string,
  sessionId: string
) => {
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      sessionId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });
};

export const registerUser = async (data: RegisterInput) => {
  const email = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already in use.', 409);
  }

  const hashedPassword = await hashPassword(data.password);
  const studentRoleId = await getStudentRoleId();
  const username = await allocateUniqueUsername(
    usernameFromIdentity({ email, fullName: data.fullName })
  );

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email,
      username,
      password: hashedPassword,
      phone: data.phone?.trim() || undefined,
      roleId: studentRoleId,
    },
    include: {
      role: true,
    },
  });

  const tokens = generateAuthTokens(user.id, user.role.name);
  const sessionId = await createUserSession({
    userId: user.id,
    deviceFingerprint: data.deviceFingerprint,
    deviceName: data.deviceName,
    os: data.os,
  });
  await persistRefreshToken(user.id, tokens.refreshToken, sessionId);
  await issueEmailVerification(user.id, user.email, user.fullName);

  void import('../notifications/admin-alert.service.js')
    .then(({ detailRows, notifyAdmins }) =>
      notifyAdmins({
        title: 'New student registration',
        message: `${user.fullName || user.email} just created a student account.`,
        emailSubject: 'New student registered',
        emailDetailsHtml: detailRows([
          ['Name', user.fullName],
          ['Email', user.email],
          ['Username', user.username],
          ['Phone', user.phone],
        ]),
        ctaPath: `/admin/students`,
        ctaLabel: 'View students',
        entityId: user.id,
        entityType: 'User',
      })
    )
    .catch((err) => console.error('[register] admin alert failed', err));

  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
};

export const loginUser = async (data: LoginInput) => {
  const identifier = data.identifier.trim();
  const identifierLower = identifier.toLowerCase();
  const looksLikeEmail = identifierLower.includes('@');

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      ...(looksLikeEmail
        ? { email: identifierLower }
        : {
            OR: [{ username: normalizeUsername(identifier) }, { email: identifierLower }],
          }),
    },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      userPermissions: { include: { permission: true } },
    },
  });

  if (!user) {
    throw new AppError('Invalid email/username or password.', 401);
  }

  const passwordCheck = await verifyPassword(data.password, user.password);
  if (!passwordCheck.valid) {
    throw new AppError('Invalid email/username or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  const tokens = generateAuthTokens(user.id, user.role.name);
  const sessionId = await createUserSession({
    userId: user.id,
    deviceFingerprint: data.deviceFingerprint,
    deviceName: data.deviceName,
    os: data.os,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  const userUpdateData: { lastLoginAt: Date; password?: string; legacyPasswordRehashedAt?: Date } = {
    lastLoginAt: new Date(),
  };

  if (passwordCheck.needsRehash) {
    userUpdateData.password = await hashPassword(data.password);
    userUpdateData.legacyPasswordRehashedAt = new Date();
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: userUpdateData,
    }),
    prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        sessionId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      },
    }),
  ]);

  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
};

export const logoutUser = async (refreshToken: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (stored) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    await prisma.userSession.updateMany({
      where: { id: stored.sessionId },
      data: { isActive: false },
    });
  }
  return { loggedOut: true };
};

export const refreshAuthTokens = async (oldRefreshToken: string) => {
  let decoded: JwtPayload;
  try {
    decoded = verifyToken({
      token: oldRefreshToken,
      secret: getJwtRefreshSecret(),
    }) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: { user: { include: { role: true } }, session: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  if (!storedToken.session.isActive) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError('Session has ended. Please log in again.', 401);
  }

  const user = storedToken.user;

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated.', 403);
  }

  const tokens = generateAuthTokens(user.id, user.role.name);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: storedToken.id } }),
    prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        sessionId: storedToken.sessionId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      },
    }),
  ]);

  return { tokens };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404);

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from the current password.', 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
  ]);
  await deactivateAllUserSessions(userId);

  return { message: 'Password changed successfully. Please log in again.' };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    return { message: 'If this email exists, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const resetLink = `${APP_BRAND.siteUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;
  const mailResult = await sendTemplatedEmail({
    to: user.email,
    templateName: 'PASSWORD_RESET',
    vars: {
      student_name: user.fullName || user.email,
      reset_link: resetLink,
    },
    fallbackSubject: `Reset your ${APP_BRAND.name} password`,
    fallbackHtml: `<p>Hello ${user.fullName || 'there'},</p><p>Reset your password using this link (valid for 10 minutes):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && !mailResult.sent) {
    console.info('[mail] Password reset link (dev fallback):', resetLink);
  }

  return {
    message: 'If this email exists, a reset link has been sent.',
    ...(isDev && { resetToken, resetLink, emailSent: mailResult.sent }),
  };
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token.', 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
  await deactivateAllUserSessions(user.id);

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

export const issueEmailVerification = async (userId: string, email: string, fullName?: string | null) => {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyLink = `${APP_BRAND.siteUrl.replace(/\/$/, '')}/verify-email/${verifyToken}`;
  const mailResult = await sendTemplatedEmail({
    to: email,
    templateName: 'EMAIL_VERIFICATION',
    vars: {
      student_name: fullName || email,
      verify_link: verifyLink,
    },
    fallbackSubject: `Verify your ${APP_BRAND.name} email`,
    fallbackHtml: `<p>Hello ${fullName || 'there'},</p><p>Verify your email: <a href="${verifyLink}">${verifyLink}</a></p>`,
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && !mailResult.sent) {
    console.info('[mail] Email verification link (dev fallback):', verifyLink);
  }

  return {
    emailSent: mailResult.sent,
    ...(isDev && { verifyToken, verifyLink }),
  };
};

export const verifyEmail = async (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { gt: new Date() },
    },
  });
  if (!user) throw new AppError('Invalid or expired verification token.', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  return { message: 'Email verified successfully.' };
};

export const resendEmailVerification = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) {
    return { message: 'If this email exists, a verification link has been sent.' };
  }
  if (user.emailVerifiedAt) {
    return { message: 'Email is already verified.' };
  }
  const issued = await issueEmailVerification(user.id, user.email, user.fullName);
  return {
    message: 'If this email exists, a verification link has been sent.',
    ...issued,
  };
};
