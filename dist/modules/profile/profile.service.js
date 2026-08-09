import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, comparePassword } from '../../utils/security/hash.js';
/**
 * Get current logged-in user profile
 */
export const getMyProfile = async (userId) => {
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
            academicLevel: true,
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
    if (!user)
        throw new AppError('User not found.', 404);
    return user;
};
/**
 * Update current logged-in user profile
 */
export const updateMyProfile = async (userId, data) => {
    // Only allow specific fields to be updated by the user themselves
    const allowedFields = ['fullName', 'phone', 'bio', 'experience', 'academicLevel'];
    const updateData = {};
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
            academicLevel: true,
            createdAt: true,
            updatedAt: true,
        }
    });
    return updatedUser;
};
/**
 * Update current user avatar
 */
export const updateMyAvatar = async (userId, avatarUrl) => {
    const value = avatarUrl === null || avatarUrl === undefined || avatarUrl === '' ? null : avatarUrl;
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: value },
    });
    return { avatar: updatedUser.avatar };
};
/**
 * Change current user password
 */
export const changeMyPassword = async (userId, currentPass, newPass) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError('User not found.', 404);
    const isMatch = await comparePassword(currentPass, user.password);
    if (!isMatch)
        throw new AppError('Current password is incorrect.', 400);
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
//# sourceMappingURL=profile.service.js.map