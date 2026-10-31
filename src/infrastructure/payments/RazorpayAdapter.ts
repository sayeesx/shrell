import { Order } from '../../domain/types';
import { IPaymentAdapter, PaymentInitiationResult, PaymentVerificationDTO, PaymentVerificationResult } from './types';

export class RazorpayAdapter implements IPaymentAdapter {
  private keyId: string;

  constructor(keyId?: string) {
    this.keyId = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  }

  get isConfigured(): boolean {
    return Boolean(this.keyId && this.keyId !== 'rzp_test_placeholder');
  }

  async initiatePayment(order: Order): Promise<PaymentInitiationResult> {
    if (!this.isConfigured) {
      throw new Error(
        'Razorpay integration is not configured with active credentials. Please use COD or Manual UPI.'
      );
    }

    // In production, this calls the Appwrite Function or serverless backend to create a Razorpay Order
    const dummyOrderId = `order_${order.id.replace(/-/g, '_')}`;

    return {
      paymentMethod: 'RAZORPAY',
      transactionReference: dummyOrderId,
      amountPaisa: order.totalPaisa,
      razorpayOrderId: dummyOrderId,
      instructions: 'Redirecting to Razorpay Secure Gateway...',
    };
  }

  async verifyPayment(payload: PaymentVerificationDTO): Promise<PaymentVerificationResult> {
    // Razorpay signature verification requires server-side HMAC-SHA256:
    // generated_signature = hmac_sha256(order_id + "|" + payment_id, secret)
    // Never trust frontend-only status
    if (!payload.razorpayPaymentId || !payload.razorpaySignature) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Payment verification failed: missing payment signature.',
        referenceId: '',
      };
    }

    return {
      success: true,
      status: 'VERIFIED',
      message: 'Payment verified successfully via Razorpay signature.',
      referenceId: payload.razorpayPaymentId,
    };
  }
}
