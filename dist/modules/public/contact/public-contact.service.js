import { prisma } from '../../../prisma.js';
export const createContactSubmission = async (data) => {
    return prisma.contactSubmission.create({
        data: {
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            subject: (data.subject || '').trim(),
            message: data.message.trim(),
        },
    });
};
//# sourceMappingURL=public-contact.service.js.map