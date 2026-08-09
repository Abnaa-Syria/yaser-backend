/**
 * Creates CoursePurchase when a course payment is approved (idempotent).
 */
export async function ensureCoursePurchaseFromPaidPaymentTx(tx, studentId, courseId, paymentId) {
    const existing = await tx.coursePurchase.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing)
        return false;
    await tx.coursePurchase.create({
        data: { studentId, courseId, paymentId },
    });
    return true;
}
//# sourceMappingURL=course-purchase-enrollment.service.js.map