import { allocatePaymentCommissionsTx } from './commission-allocation.service.js';
/** Credits instructor wallets via commission allocation rules. */
export async function creditInstructorForPaidPaymentTx(tx, payment) {
    await allocatePaymentCommissionsTx(tx, payment);
}
//# sourceMappingURL=payment-wallet-credit.service.js.map