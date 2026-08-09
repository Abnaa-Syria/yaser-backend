import { z } from 'zod';
export const issueCertificateSchema = z.object({
    body: z.object({
        studentId: z.string().uuid(),
        title: z.string().min(1),
        courseId: z.string().uuid().optional(),
        examId: z.string().uuid().optional(),
    }),
});
export const certificateIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});
export const listCertificatesSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        studentId: z.string().uuid().optional(),
        courseId: z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=admin-certificate.validation.js.map