import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

export type SessionContext = {
  userId: string;
  deviceFingerprint?: string;
  deviceName?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
};

const DEFAULT_MAX_TRUSTED_DEVICES = 2;

async function getMaxTrustedDevices(): Promise<number> {
  const row = await prisma.platformSetting.findUnique({ where: { key: 'MAX_TRUSTED_DEVICES' } });
  if (!row) {
    void prisma.platformSetting
      .create({ data: { key: 'MAX_TRUSTED_DEVICES', value: DEFAULT_MAX_TRUSTED_DEVICES } })
      .catch(() => undefined);
    return DEFAULT_MAX_TRUSTED_DEVICES;
  }
  const raw = row.value;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return DEFAULT_MAX_TRUSTED_DEVICES;
}

/**
 * Creates or reuses a device, enforces single active session for students,
 * and returns the new session id for refresh-token binding.
 * Students are limited to MAX_TRUSTED_DEVICES (default 2) trusted devices.
 */
export const createUserSession = async (ctx: SessionContext): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    include: { role: true },
  });
  if (!user) throw new Error('User not found');

  const isStudent = user.role.name === 'STUDENT';
  const fingerprint = ctx.deviceFingerprint ?? `legacy-${ctx.userId}`;

  let device = await prisma.userDevice.findUnique({
    where: {
      studentId_deviceFingerprint: {
        studentId: ctx.userId,
        deviceFingerprint: fingerprint,
      },
    },
  });

  if (device) {
    device = await prisma.userDevice.update({
      where: { id: device.id },
      data: {
        deviceName: ctx.deviceName ?? undefined,
        os: ctx.os ?? undefined,
      },
    });
    if (isStudent && !device.isTrusted) {
      const pending = await prisma.deviceReplacementRequest.findFirst({
        where: {
          studentId: ctx.userId,
          newFingerprint: fingerprint,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
      throw new AppError(
        'This device is not trusted. Wait for admin approval or request a device replacement.',
        403,
        {
          code: 'DEVICE_NOT_TRUSTED',
          details: {
            pendingRequestId: pending?.id || null,
            pendingStatus: pending?.status || null,
          },
        }
      );
    }
  } else if (isStudent) {
    const maxTrusted = await getMaxTrustedDevices();
    const trustedDevices = await prisma.userDevice.findMany({
      where: { studentId: ctx.userId, isTrusted: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        os: true,
        deviceFingerprint: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (trustedDevices.length >= maxTrusted) {
      const pending = await prisma.deviceReplacementRequest.findFirst({
        where: { studentId: ctx.userId, newFingerprint: fingerprint, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
      throw new AppError(
        'Device limit reached. You can use up to 2 trusted devices. Request admin approval to replace one.',
        403,
        {
          code: 'DEVICE_LIMIT',
          details: {
            maxTrustedDevices: maxTrusted,
            devices: trustedDevices.map((d) => ({
              id: d.id,
              deviceName: d.deviceName,
              os: d.os,
              fingerprintShort: d.deviceFingerprint.slice(0, 10),
              lastSeenAt: d.updatedAt,
              createdAt: d.createdAt,
            })),
            pendingRequestId: pending?.id || null,
            newFingerprint: fingerprint,
          },
        }
      );
    }

    device = await prisma.userDevice.create({
      data: {
        studentId: ctx.userId,
        deviceFingerprint: fingerprint,
        deviceName: ctx.deviceName,
        os: ctx.os,
        isTrusted: true,
      },
    });
  } else {
    device = await prisma.userDevice.create({
      data: {
        studentId: ctx.userId,
        deviceFingerprint: fingerprint,
        deviceName: ctx.deviceName,
        os: ctx.os,
        isTrusted: true,
      },
    });
  }

  if (isStudent) {
    await prisma.userSession.updateMany({
      where: { studentId: ctx.userId, isActive: true },
      data: { isActive: false },
    });
  }

  const session = await prisma.userSession.create({
    data: {
      studentId: ctx.userId,
      deviceId: device.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      isActive: true,
      lastHeartbeatAt: new Date(),
    },
  });

  return session.id;
};

export const touchSessionHeartbeat = async (sessionId: string) => {
  return prisma.userSession.update({
    where: { id: sessionId },
    data: { lastHeartbeatAt: new Date(), isActive: true },
  });
};

export const deactivateSession = async (sessionId: string) => {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
  await prisma.refreshToken.deleteMany({ where: { sessionId } });
};

export const deactivateAllUserSessions = async (userId: string) => {
  await prisma.userSession.updateMany({
    where: { studentId: userId, isActive: true },
    data: { isActive: false },
  });
  await prisma.refreshToken.deleteMany({ where: { userId } });
};
