import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, comparePassword } from '../../utils/security/hash.js';

/**
 * Get current logged-in user profile
 */
export const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatar: true,
      bio: true,
      experience: true,
      averageRating: true,
      commissionRate: true,
      createdAt: true,
      updatedAt: true,
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    }
  });

  if (!user) throw new AppError('User not found.', 404);
  return user;
};

/**
 * Update current logged-in user profile
 */
export const updateMyProfile = async (userId: string, data: any) => {
  // Only allow specific fields to be updated by the user themselves
  const allowedFields = ['fullName', 'phone', 'bio', 'experience'];
  const updateData: any = {};
  
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = data[key];
    }
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatar: true,
      bio: true,
      experience: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  return updatedUser;
};

/**
 * Update current user avatar
 */
export const updateMyAvatar = async (userId: string, avatarUrl: string | null) => {
  const value =
    avatarUrl === null || avatarUrl === undefined || avatarUrl === '' ? null : avatarUrl;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatar: value },
  });

  return { avatar: updatedUser.avatar };
};

/**
 * Change current user password
 */
export const changeMyPassword = async (userId: string, currentPass: string, newPass: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404);

  const isMatch = await comparePassword(currentPass, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  const hashedPassword = await hashPassword(newPass);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);

  return { message: 'Password changed successfully. Please log in again.' };
};
