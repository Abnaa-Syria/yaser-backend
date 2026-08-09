import type { Prisma } from '@prisma/client';
import { allocatePaymentCommissionsTx } from './commission-allocation.service.js';

export type PaymentCreditInput = {
  id: string;
  amount: number;
  courseId: string | null;
  availabilityId: string | null;
};

/** Credits instructor wallets via commission allocation rules. */
export async function creditInstructorForPaidPaymentTx(
  tx: Prisma.TransactionClient,
  payment: PaymentCreditInput
): Promise<void> {
  await allocatePaymentCommissionsTx(tx, payment);
}
