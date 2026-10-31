import { Order } from '../../domain/types';
import { IPaymentAdapter, PaymentInitiationResult, PaymentVerificationDTO, PaymentVerificationResult } from './types';

export class CODAdapter implements IPaymentAdapter {
  async initiatePayment(order: Order): Promise<PaymentInitiationResult> {
    return {
      paymentMethod: 'COD',
      transactionReference: `COD-${order.id}`,
      amountPaisa: order.totalPaisa,
      instructions: 'Pay via cash or UPI to the courier delivery executive upon arrival.',
    };
  }

  async verifyPayment(payload: PaymentVerificationDTO): Promise<PaymentVerificationResult> {
    return {
      success: true,
      status: 'PENDING',
      message: 'Cash on delivery payment pending physical delivery handover.',
      referenceId: payload.orderId,
    };
  }
}
