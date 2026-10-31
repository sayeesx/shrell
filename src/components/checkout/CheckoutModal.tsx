import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { Order, PaymentMethod } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { orderRepository } from '../../infrastructure/repositories';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';
import { useBodyScrollLock } from '../common/useBodyScrollLock';
import { ThemeSuccessAnimation } from '../common/ThemeFeedbackAnimation';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const CheckoutModal: React.FC = () => {
  const { cart, clearCart, isCheckoutOpen, closeCheckout } = useCart();

  useBodyScrollLock(isCheckoutOpen);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MANUAL_UPI');
  const [utrNumber, setUtrNumber] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const storeUpiId = import.meta.env.VITE_STORE_UPI_ID || 'shrell@icici';

  // Reset order state when modal closes
  useEffect(() => {
    if (!isCheckoutOpen) {
      setErrorMessage('');
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDone = () => {
    setCreatedOrder(null);
    closeCheckout();
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Phone validation (Indian 10-digit standard)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please provide a valid 10-digit Indian mobile number for shipment tracking.');
      return;
    }

    // 2. PIN Code validation (Indian 6-digit standard)
    const cleanPin = postalCode.replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    // 3. UTR validation if Manual UPI selected
    if (paymentMethod === 'MANUAL_UPI') {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr || cleanUtr.length < 10) {
        setErrorMessage('Please provide a valid 12-digit UPI UTR transaction reference number.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const itemsSnapshot = cart.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        orderId: '',
        productId: it.productId,
        productName: it.product.name,
        sku: it.product.sku,
        quantity: it.quantity,
        unitPricePaisa: it.unitPricePaisa,
        subtotalPaisa: it.subtotalPaisa,
        imageUrl: it.product.images[0]?.url || '',
      }));

      const shippingAddress = {
        id: `addr-${Date.now()}`,
        customerId: `cust-${cleanPhone}`,
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        district: city.trim(),
        state,
        postalCode: postalCode.trim(),
        isDefault: true,
      };

      const newOrder = await orderRepository.createOrder({
        customerId: `cust-${cleanPhone}`,
        customerName: fullName,
        customerEmail: email || `${cleanPhone}@guest.shrell.com`,
        customerPhone: cleanPhone,
        status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        paymentMethod,
        paymentReference: paymentMethod === 'MANUAL_UPI' ? utrNumber.trim() : undefined,
        subtotalPaisa: cart.subtotalPaisa,
        taxPaisa: cart.taxPaisa,
        shippingPaisa: cart.shippingPaisa,
        discountPaisa: cart.discountPaisa,
        totalPaisa: cart.totalPaisa,
        shippingAddress,
        deliveryInstructions,
        items: itemsSnapshot,
        idempotencyKey,
      });

      clearCart();
      setCreatedOrder(newOrder);
    } catch (err: any) {
      console.error('Order placement failed:', err);
      setErrorMessage(err.message || 'Failed to place order. Please review your details and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-end md:justify-center md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCheckout}
        aria-hidden="true"
      />

      {/* Modal / Drawer (Opens from Right) */}
      <div
        className="relative z-10 w-[92%] sm:w-[85%] md:w-full max-w-md md:max-w-2xl h-[100dvh] md:h-auto md:max-h-[90vh] bg-[#0E0A0B] text-[#F1EEEE] border-l md:border border-[#261619] shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col md:rounded-2xl animate-slide-right-drawer md:animate-none overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with SHRELL Logo as Home button + Close X */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#261619] bg-[#0A0808] flex-shrink-0">
          <div className="flex items-center">
            {/* SHRELL Home Button */}
            <Link
              to="/"
              onClick={closeCheckout}
              className="flex items-center group cursor-pointer"
              aria-label="SHRELL Home"
            >
              <img
                src="/logos/shrell-logo-white.png"
                alt="SHRELL Automotive"
                className="h-[22px] w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          <button
            type="button"
            onClick={closeCheckout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E8587] hover:text-[#F1EEEE] bg-[#130E10] hover:bg-[#1A1214] border border-[#261619] transition-colors cursor-pointer"
            aria-label="Close checkout"
          >
            <i className="bi bi-x-lg text-xs" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* STATE 1: ORDER CONFIRMED */}
          {createdOrder ? (
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div className="flex justify-center">
                <ThemeSuccessAnimation size={96} />
              </div>

              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#FF000E] font-sans">
                  Order Confirmed
                </span>
                <h1 className="text-2xl font-semibold text-[#F1EEEE] tracking-tight mt-1">
                  Thank you, {createdOrder.customerName}
                </h1>
                <p className="text-xs text-[#8E8587] max-w-sm mx-auto mt-1">
                  Your order <span className="font-mono font-medium text-[#F1EEEE]">{createdOrder.id}</span> has been received and queued for dispatch.
                </p>
              </div>

              <div className="p-4 bg-[#130E10] border border-[#261619] rounded-xl text-left text-xs space-y-2.5 font-sans">
                <div className="flex justify-between text-[#8E8587]">
                  <span>Order Reference</span>
                  <strong className="text-[#F1EEEE] font-mono font-medium">{createdOrder.id}</strong>
                </div>
                <div className="flex justify-between text-[#8E8587]">
                  <span>Payment Mode</span>
                  <strong className="text-[#F1EEEE] font-medium">
                    {createdOrder.paymentMethod === 'MANUAL_UPI' ? 'Direct Bank UPI (UTR)' : 'Cash on Delivery (COD)'}
                  </strong>
                </div>
                <div className="flex justify-between text-[#8E8587]">
                  <span>Amount</span>
                  <strong className="text-[#FF000E] font-semibold">{formatINR(createdOrder.totalPaisa)}</strong>
                </div>
                <div className="flex justify-between text-[#8E8587] pt-2 border-t border-[#261619]">
                  <span>Delivery Address</span>
                  <span className="text-[#D8D1D1] font-normal text-right max-w-[220px]">
                    {createdOrder.shippingAddress.addressLine1}, {createdOrder.shippingAddress.city},{' '}
                    {createdOrder.shippingAddress.state} - {createdOrder.shippingAddress.postalCode}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>

                <a
                  href={whatsAppService.getOrderSupportLink(createdOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#130E10] hover:bg-[#1A1214] border border-[#261619] text-[#D8D1D1] hover:text-[#F1EEEE] text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="bi bi-whatsapp text-sm text-emerald-400" aria-hidden="true"></i>
                  <span>Track with WhatsApp Support</span>
                </a>
              </div>
            </div>
          ) : cart.items.length === 0 ? (
            /* STATE 2: EMPTY CART */
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#130E10] border border-[#261619] flex items-center justify-center mx-auto text-[#8E8587]">
                <i className="bi bi-bag-x text-3xl" />
              </div>
              <h2 className="text-xl font-semibold text-[#F1EEEE]">Your Shopping Cart is Empty</h2>
              <p className="text-xs text-[#8E8587] max-w-xs mx-auto">
                Add automotive equipment or accessories to your cart before proceeding to checkout.
              </p>
              <button
                type="button"
                onClick={closeCheckout}
                className="px-6 py-2.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
              >
                Browse Catalogue
              </button>
            </div>
          ) : (
            /* STATE 3: CHECKOUT FORM */
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Order Items Preview */}
              <div className="p-3.5 rounded-xl bg-[#130E10] border border-[#261619] space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#D8D1D1] border-b border-[#261619] pb-2">
                  <span>Order Items ({cart.items.length})</span>
                  <span className="text-[#F1EEEE] font-semibold">{formatINR(cart.totalPaisa)}</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-[11px] text-[#D8D1D1]">
                      <span className="truncate max-w-[220px]">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-mono text-[#F1EEEE] flex-shrink-0">
                        {formatINR(item.subtotalPaisa)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-[#F1EEEE] uppercase tracking-wider font-mono flex items-center gap-2">
                  <i className="bi bi-geo-alt-fill text-[#FF000E]"></i>
                  <span>Delivery Address</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#8E8587] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8E8587] mb-1">Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                      maxLength={10}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#8E8587] mb-1">Email Address (Optional for Invoice)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#8E8587] mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      placeholder="House / Flat / Street Name"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#8E8587] mb-1">Address Line 2 (Apartment / Landmark)</label>
                    <input
                      type="text"
                      placeholder="Near City Center / Building 4B"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8E8587] mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8E8587] mb-1">State *</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] focus:outline-none focus:border-[#FF000E]"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s} className="bg-[#130E10] text-[#F1EEEE]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#8E8587] mb-1">PIN Code (6 digits) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 411001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                      maxLength={6}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#8E8587] mb-1">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Leave with security / Call upon arrival"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] placeholder-[#5C5456] focus:outline-none focus:border-[#FF000E]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-[#F1EEEE] uppercase tracking-wider font-mono flex items-center gap-2">
                  <i className="bi bi-credit-card-2-front-fill text-[#FF000E]"></i>
                  <span>Payment Method</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MANUAL_UPI')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'MANUAL_UPI'
                        ? 'border-[#FF000E] bg-[#650008]/20 text-[#F1EEEE]'
                        : 'border-[#261619] bg-[#130E10] text-[#8E8587] hover:text-[#F1EEEE]'
                    }`}
                  >
                    <div className="font-semibold text-sm text-[#FF000E] flex items-center gap-1.5">
                      <i className="bi bi-qr-code"></i> Direct UPI
                    </div>
                    <div className="text-[10px] text-[#8E8587] mt-1">GPay, PhonePe, Paytm (UTR)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-[#FF000E] bg-[#650008]/20 text-[#F1EEEE]'
                        : 'border-[#261619] bg-[#130E10] text-[#8E8587] hover:text-[#F1EEEE]'
                    }`}
                  >
                    <div className="font-semibold text-sm text-[#F1EEEE] flex items-center gap-1.5">
                      <i className="bi bi-cash-stack text-[#FF000E]"></i> Pay on Delivery
                    </div>
                    <div className="text-[10px] text-[#8E8587] mt-1">Cash or UPI on arrival</div>
                  </button>
                </div>

                {/* Direct UPI Instructions Box */}
                {paymentMethod === 'MANUAL_UPI' && (
                  <div className="p-3.5 rounded-xl bg-[#130E10] border border-[#261619] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8587]">Official Store UPI ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#F1EEEE] font-semibold">{storeUpiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-2 py-0.5 rounded bg-[#1A1214] hover:bg-[#261619] border border-[#261619] text-[#F1EEEE] text-[10px] cursor-pointer"
                        >
                          {copiedUpi ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#8E8587] mb-1">
                        12-Digit UPI Transaction UTR Reference *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 430129847120"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full bg-[#0A0808] border border-[#261619] rounded-lg px-3 py-2 text-[#F1EEEE] font-mono text-xs focus:outline-none focus:border-[#FF000E]"
                        maxLength={18}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#3D080C] border border-[#B0000A] text-[#FF2E3A] text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-50 text-white font-medium text-sm tracking-wide transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  {isSubmitting ? 'Confirming Order...' : `Place Order • ${formatINR(cart.totalPaisa)}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
