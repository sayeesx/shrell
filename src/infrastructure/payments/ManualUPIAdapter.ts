import { Order } from '../../domain/types';
import { paisaToRupees } from '../../domain/services/CurrencyService';
import { IPaymentAdapter, PaymentInitiationResult, PaymentVerificationDTO, PaymentVerificationResult } from './types';

export class ManualUPIAdapter implements IPaymentAdapter {
  private upiId: string;
  private merchantName: string;

  constructor(upiId?: string, merchantName?: string) {
    this.upiId = upiId || import.meta.env.VITE_STORE_UPI_ID || 'shrell@icici';
    this.merchantName = merchantName || import.meta.env.VITE_STORE_UPI_NAME || 'SHRELL Automotive India';
  }

  async initiatePayment(order: Order): Promise<PaymentInitiationResult> {
    const rupees = paisaToRupees(order.totalPaisa).toFixed(2);
    const note = `Order ${order.id}`;

    // Standard NPCI UPI URI Specification
    const upiUri = `upi://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(
      this.merchantName
    )}&am=${rupees}&cu=INR&tn=${encodeURIComponent(note)}`;

    return {
      paymentMethod: 'MANUAL_UPI',
      transactionReference: `UPI-INIT-${order.id}`,
      amountPaisa: order.totalPaisa,
      upiUri,
      instructions: `1. Scan QR code or copy UPI ID: ${this.upiId}\n2. Enter exact amount: ₹${rupees}\n3. Include note: ${note}\n4. Submit 12-digit UTR reference number below.`,
    };
  }

  async verifyPayment(payload: PaymentVerificationDTO): Promise<PaymentVerificationResult> {
    const utr = payload.utrNumber?.trim();
    if (!utr) {
      return {
        success: false,
        status: 'FAILED',
        message: 'A 12-digit UPI Transaction Reference (UTR) is required.',
        referenceId: '',
      };
    }

    // Standard Indian banking UTR is a 12-digit numeric identifier
    const isValidUTR = /^[0-9]{12}$/.test(utr);
    if (!isValidUTR) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Invalid UTR format. Please provide the 12-digit numeric reference from your UPI app receipt.',
        referenceId: utr,
      };
    }

    return {
      success: true,
      status: 'PENDING',
      message: 'UTR submitted successfully. Awaiting administrative reconciliation against bank records.',
      referenceId: utr,
    };
  }
}
