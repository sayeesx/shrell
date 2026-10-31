import { Order, PaymentMethod } from '../../domain/types';

export interface PaymentInitiationResult {
  paymentMethod: PaymentMethod;
  transactionReference: string;
  amountPaisa: number;
  instructions?: string;
  upiUri?: string;
  razorpayOrderId?: string;
}

export interface PaymentVerificationDTO {
  orderId: string;
  paymentMethod: PaymentMethod;
  utrNumber?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  message: string;
  referenceId: string;
}

export interface IPaymentAdapter {
  initiatePayment(order: Order): Promise<PaymentInitiationResult>;
  verifyPayment(payload: PaymentVerificationDTO): Promise<PaymentVerificationResult>;
}
