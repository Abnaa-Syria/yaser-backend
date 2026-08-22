import { prisma } from '../../../prisma.js';
import { createNotification } from '../../notifications/notification.service.js';
import { detailRows, notifyAdmins } from '../../notifications/admin-alert.service.js';
import { sendMail } from '../../../utils/mail.js';
import { emailHeading, emailParagraph } from '../../../utils/email-layout.js';
import { APP_BRAND } from '../../../config/brand.config.js';

type PaymentLike = {
  id: string;
  amount: unknown;
  paymentMethod?: string | null;
  status: string;
  priceSnapshot?: unknown;
};

export async function notifyPurchaseActivity(input: {
  studentId: string;
  payment: PaymentLike;
  productKind: 'course' | 'package' | 'private_session';
  productTitle: string;
  reusedPending?: boolean;
  enrolledInstantly?: boolean;
}) {
  const student = await prisma.user.findUnique({
    where: { id: input.studentId },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  if (!student) return;

  const amount = Number(input.payment.amount || 0);
  const kindLabel =
    input.productKind === 'package'
      ? 'package'
      : input.productKind === 'private_session'
        ? 'private session'
        : 'course';

  if (input.enrolledInstantly) {
    void notifyAdmins({
      title: `Instant ${kindLabel} enrollment`,
      message: `${student.fullName || student.email} enrolled in ${input.productTitle} (free / instant).`,
      emailSubject: `Instant enrollment — ${input.productTitle}`,
      emailDetailsHtml: detailRows([
        ['Student', student.fullName],
        ['Email', student.email],
        ['Item', input.productTitle],
        ['Type', kindLabel],
      ]),
      ctaPath: '/admin/finance',
      ctaLabel: 'Open finance',
      entityId: input.payment.id,
      entityType: 'Payment',
    });
    return;
  }

  if (input.payment.status !== 'PENDING') return;

  const action = input.reusedPending ? 'updated a pending payment for' : 'submitted a payment request for';
  const title = `Payment request — ${input.productTitle}`;
  const message = `${student.fullName || student.email} ${action} ${input.productTitle} (${amount} USD).`;

  void notifyAdmins({
    title,
    message,
    emailSubject: title,
    emailDetailsHtml: detailRows([
      ['Student', student.fullName],
      ['Email', student.email],
      ['Phone', student.phone],
      ['Item', input.productTitle],
      ['Type', kindLabel],
      ['Amount', `${amount} USD`],
      ['Method', input.payment.paymentMethod],
      ['Payment ID', input.payment.id],
    ]),
    ctaPath: '/admin/finance',
    ctaLabel: 'Review payments',
    entityId: input.payment.id,
    entityType: 'Payment',
  });

  void createNotification(
    student.id,
    'Payment request received',
    `We received your payment request for ${input.productTitle}. Our team will review it shortly.`,
    'GENERAL',
    undefined,
    { entityId: input.payment.id, entityType: 'Payment' }
  );

  if (student.email) {
    void sendMail({
      to: student.email,
      subject: `We received your payment request — ${input.productTitle}`,
      html: [
        emailHeading('Payment request received'),
        emailParagraph(`Hi ${student.fullName || 'there'},`),
        emailParagraph(
          `We received your payment request for "${input.productTitle}" (${amount} USD). Our team will review it and activate access once confirmed.`
        ),
        emailParagraph(`You can track updates inside your account on ${APP_BRAND.name}.`),
      ].join('\n'),
    });
  }
}
