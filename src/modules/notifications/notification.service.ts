import { prisma } from '../../prisma.js';
import { NotificationType } from '@prisma/client';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'GENERAL',
  txClient?: any // Accepts a transaction client to participate in atomicity
) => {
  const db = txClient || prisma;
  return await db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
};

export const getUserNotifications = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { id: 'desc' }, // Using ID for ordering as a fallback, but normally createdAt is best
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
