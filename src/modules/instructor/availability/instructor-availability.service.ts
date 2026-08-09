import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

/**
 * Adds a new availability slot for an instructor.
 * 
 * @param instructorId ID of the instructor
 * @param startTime Start time of the availability slot
 * @param endTime End time of the availability slot
 * @returns The newly created InstructorAvailability object
 */
export const addAvailability = async (
  instructorId: string,
  startTime: Date,
  endTime: Date,
  price: number
) => {
  if (!Number.isFinite(price) || price <= 0) {
    throw new AppError('A positive session price is required.', 400);
  }

  return await prisma.instructorAvailability.create({
    data: {
      instructorId,
      startTime,
      endTime,
      price,
      status: 'AVAILABLE',
    },
  });
};

export const listMyAvailability = async (instructorId: string) => {
  return prisma.instructorAvailability.findMany({
    where: { instructorId },
    orderBy: { startTime: 'asc' },
  });
};

export const deleteAvailabilitySlot = async (instructorId: string, slotId: string) => {
  const slot = await prisma.instructorAvailability.findUnique({ where: { id: slotId } });
  if (!slot || slot.instructorId !== instructorId) {
    throw new AppError('Availability slot not found', 404);
  }
  if (slot.status !== 'AVAILABLE') {
    throw new AppError('Only available slots can be removed.', 400);
  }
  await prisma.instructorAvailability.delete({ where: { id: slotId } });
  return { id: slotId };
};

export const updateAvailabilitySlotPrice = async (
  instructorId: string,
  slotId: string,
  price: number
) => {
  if (!Number.isFinite(price) || price <= 0) {
    throw new AppError('A positive session price is required.', 400);
  }

  const slot = await prisma.instructorAvailability.findUnique({ where: { id: slotId } });
  if (!slot || slot.instructorId !== instructorId) {
    throw new AppError('Availability slot not found', 404);
  }
  if (slot.status !== 'AVAILABLE') {
    throw new AppError('Only available slots can be updated.', 400);
  }

  return prisma.instructorAvailability.update({
    where: { id: slotId },
    data: { price },
  });
};
