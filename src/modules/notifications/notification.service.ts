import { prisma } from '../../prisma.js';
import { NotificationType } from '@prisma/client';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'GENERAL',
  txClient?: any,
  meta?: { entityId?: string; entityType?: string }
) => {
  const db = txClient || prisma;
  return await db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      entityId: meta?.entityId || null,
      entityType: meta?.entityType || null,
    },
  });
};

export const getUserNotifications = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const markAsRead = async (userId: string, notificationId: string) => {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
