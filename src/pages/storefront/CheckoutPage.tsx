import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { Order, PaymentMethod } from '../../domain/types';
import { formatINR, paisaToRupees } from '../../domain/services/CurrencyService';
import { orderRepository } from '../../infrastructure/repositories';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

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

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { finishPageLoad } = useNavigationLoading();

  useEffect(() => {
    finishPageLoad();
  }, [finishPageLoad]);

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
  const storeUpiName = import.meta.env.VITE_STORE_UPI_NAME || 'SHRELL Automotive India';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
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

  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-6">
        <div className="p-6 sm:p-10 rounded-lg bg-white border border-gray-200 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            <i className="bi bi-check2-circle" aria-hidden="true"></i>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mt-1">
              Thank you, {createdOrder.customerName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1">
              Your order <span className="font-mono font-bold text-gray-900">{createdOrder.id}</span> has been received and queued for dispatch.
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-[#F6F6F6] border border-gray-200 rounded-lg text-left text-xs space-y-2.5 font-sans">
            <div className="flex justify-between text-gray-600">
              <span>Order Reference</span>
              <strong className="text-gray-900 font-mono font-bold">{createdOrder.id}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payment Mode</span>
              <strong className="text-gray-900 font-bold">
                {createdOrder.paymentMethod === 'MANUAL_UPI' ? 'Direct Bank UPI (UTR Verified)' : 'Cash on Delivery (COD)'}
              </strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Amount</span>
              <strong className="text-gray-950 font-bold">{formatINR(createdOrder.totalPaisa)}</strong>
            </div>
            <div className="flex justify-between text-gray-600 pt-1 border-t border-gray-200">
              <span>Delivery Address</span>
              <span className="text-gray-900 font-medium text-right max-w-[260px]">
                {createdOrder.shippingAddress.addressLine1}, {createdOrder.shippingAddress.city}, {createdOrder.shippingAddress.state} - {createdOrder.shippingAddress.postalCode}
              </span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalogue"
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 text-xs font-semibold transition-colors"
            >
              Continue Shopping
            </Link>

            <a
              href={whatsAppService.getOrderSupportLink(createdOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#251E1B] hover:bg-black text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <i className="bi bi-whatsapp text-sm" aria-hidden="true"></i>
              <span>Track with WhatsApp Support</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-950">Your Cart is Empty</h1>
        <p className="text-gray-500 text-xs">
          Select precision car accessories from our catalogue before checking out.
        </p>
        <div>
          <Link
            to="/catalogue"
            className="inline-block px-6 py-2.5 rounded-lg bg-gray-950 hover:bg-black text-white font-semibold text-xs transition-colors"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const rupeesPayable = paisaToRupees(cart.totalPaisa).toFixed(2);
  const upiUri = `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(
    storeUpiName
  )}&am=${rupeesPayable}&cu=INR&tn=${encodeURIComponent('shrell Equipment Order')}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        
        {/* Header (Cohesive with Product Detail Page) */}
        <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
              SHRELL SECURE CHECKOUT
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mt-0.5">
              Checkout &amp; Delivery Details
            </h1>
          </div>
          <Link
            to="/"
            className="flex items-center group cursor-pointer"
            aria-label="SHRELL Home"
          >
            <img
              src="/logos/shrell-logo-white.png"
              alt="SHRELL Automotive"
              className="h-[22px] w-auto object-contain filter invert"
            />
          </Link>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Customer Address & Payment Selection (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* 1. Delivery Information */}
              <div className="p-5 sm:p-6 rounded-lg bg-white border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-bold text-gray-950 tracking-tight flex items-center gap-2">
                    <i className="bi bi-geo-alt text-brand-600" aria-hidden="true"></i>
                    <span>1. Shipping Destination</span>
                  </h2>
                  <span className="text-[11px] text-gray-400 font-mono">Pan-India Express</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="full-name" className="block text-xs font-semibold text-gray-800 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone-num" className="block text-xs font-semibold text-gray-800 mb-1">
                      Mobile Number (10 Digits) *
                    </label>
                    <input
                      id="phone-num"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9820012345"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email-addr" className="block text-xs font-semibold text-gray-800 mb-1">
                      Email Address (For Tax Invoice &amp; Courier Tracking)
                    </label>
                    <input
                      id="email-addr"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. vikram@example.com"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="addr-1" className="block text-xs font-semibold text-gray-800 mb-1">
                      Street Address &amp; Flat / House *
                    </label>
                    <input
                      id="addr-1"
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Flat No, Building, Street / Road"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="addr-2" className="block text-xs font-semibold text-gray-800 mb-1">
                      Landmark or Area (Optional)
                    </label>
                    <input
                      id="addr-2"
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Near Metro Station, Sector 21"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="city-name" className="block text-xs font-semibold text-gray-800 mb-1">
                      City / District *
                    </label>
                    <input
                      id="city-name"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="state-select" className="block text-xs font-semibold text-gray-800 mb-1">
                      State *
                    </label>
                    <select
                      id="state-select"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-900 transition-colors cursor-pointer"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pincode-num" className="block text-xs font-semibold text-gray-800 mb-1">
                      PIN Code (6 Digits) *
                    </label>
                    <input
                      id="pincode-num"
                      type="text"
                      required
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 411001"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="delivery-notes" className="block text-xs font-semibold text-gray-800 mb-1">
                      Delivery Instructions (Optional)
                    </label>
                    <input
                      id="delivery-notes"
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Deliver before 5 PM"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Payment Method */}
              <div className="p-5 sm:p-6 rounded-lg bg-white border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-bold text-gray-950 tracking-tight flex items-center gap-2">
                    <i className="bi bi-shield-check text-brand-600" aria-hidden="true"></i>
                    <span>2. Payment Option</span>
                  </h2>
                  <span className="text-[11px] text-gray-400 font-mono">100% Encrypted</span>
                </div>

                <div className="space-y-3">
                  {/* Option A: Direct Bank UPI */}
                  <label
                    htmlFor="pay-upi"
                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'MANUAL_UPI'
                        ? 'border-gray-900 bg-gray-50/50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        id="pay-upi"
                        type="radio"
                        name="payment_method"
                        value="MANUAL_UPI"
                        checked={paymentMethod === 'MANUAL_UPI'}
                        onChange={() => setPaymentMethod('MANUAL_UPI')}
                        className="mt-0.5 text-gray-900 focus:ring-gray-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">
                            Direct Bank UPI (Instant Clearance)
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            0% Fee
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Pay directly using Google Pay, PhonePe, Paytm, or BHIM.
                        </p>
                      </div>
                    </div>

                    {paymentMethod === 'MANUAL_UPI' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-xs">
                        <div className="p-3.5 bg-[#F6F6F6] border border-gray-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">SHRELL UPI ID:</span>
                            <div className="flex items-center gap-2">
                              <code className="text-gray-900 font-bold font-mono text-xs">{storeUpiId}</code>
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-semibold"
                                aria-label="Copy UPI ID"
                              >
                                {copiedUpi ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-gray-600">
                            <span>Amount to Transfer:</span>
                            <span className="text-gray-950 font-bold font-mono">{formatINR(cart.totalPaisa)}</span>
                          </div>

                          <div className="pt-1.5">
                            <a
                              href={upiUri}
                              className="block text-center py-2 px-3 rounded-lg bg-gray-900 hover:bg-black text-white font-semibold text-xs transition-colors"
                            >
                              Launch UPI App (GPay / PhonePe / Paytm)
                            </a>
                          </div>
                        </div>

                        {/* Manual UTR reference entry */}
                        <div>
                          <label htmlFor="utr-input" className="block text-[11px] font-bold text-gray-800 mb-1">
                            12-Digit UPI Transaction Reference (UTR) *
                          </label>
                          <input
                            id="utr-input"
                            type="text"
                            required={paymentMethod === 'MANUAL_UPI'}
                            maxLength={12}
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="e.g. 412389102938"
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
                          />
                          <span className="text-[10px] text-gray-500 mt-1 block">
                            Found in your UPI payment confirmation under "UPI Ref No." or "UTR".
                          </span>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Option B: Cash on Delivery */}
                  <label
                    htmlFor="pay-cod"
                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-gray-900 bg-gray-50/50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        id="pay-cod"
                        type="radio"
                        name="payment_method"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="mt-0.5 text-gray-900 focus:ring-gray-900"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          Cash on Delivery (COD)
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Pay cash or scan courier QR upon arrival via BlueDart &amp; Delhivery Express.
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT: Order Invoice Review & Action (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 sm:p-6 rounded-lg bg-white border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-bold text-gray-950 tracking-tight">
                    Order Summary
                  </h2>
                  <span className="text-xs text-gray-500 font-mono">
                    {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items itemized list with thumbnails (matched to Product page style) */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-gray-100">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-[#0E0A0B] border border-[#261619] p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.product.images[0]?.url || '/logos/shrell-full_white-text_black-logo.png'}
                          alt={item.product.name}
                          className="w-full h-full object-contain opacity-40 brightness-125 grayscale"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-950 line-clamp-1">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          Qty: {item.quantity} × {formatINR(item.unitPricePaisa)}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-gray-950 font-mono">
                        {formatINR(item.subtotalPaisa)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Calculations */}
                <div className="pt-3 border-t border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="text-gray-950 font-semibold font-mono">{formatINR(cart.subtotalPaisa)}</span>
                  </div>
                  {cart.discountPaisa > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount</span>
                      <span className="font-mono">-{formatINR(cart.discountPaisa)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Courier</span>
                    <span className="text-gray-950 font-semibold font-mono">
                      {cart.shippingPaisa === 0 ? 'FREE' : formatINR(cart.shippingPaisa)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Applicable Tax</span>
                    <span className="font-mono">{formatINR(cart.taxPaisa)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between text-base font-bold text-gray-950">
                    <span>Total</span>
                    <span className="font-mono">{formatINR(cart.totalPaisa)}</span>
                  </div>
                </div>

                {/* Submit Order Button (styled like the product detail 'Buy it now' button) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 sm:py-4 rounded-lg bg-[#251E1B] hover:bg-black disabled:bg-gray-300 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Securing Order...</span>
                  ) : (
                    <>
                      <span>Complete Order</span>
                      <i className="bi bi-arrow-right text-xs" aria-hidden="true"></i>
                    </>
                  )}
                </button>

                {/* Payment trust icons (same as PDP) */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-center">
                  <p className="text-[11px] text-gray-500 font-medium">
                    Guaranteed Safe &amp; Secure Checkout
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="h-5 px-1.5 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center">
                      <span className="font-extrabold text-[10px] tracking-wider text-[#1A1F71] italic">VISA</span>
                    </div>
                    <div className="h-5 px-1.5 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center gap-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#EB001B] inline-block opacity-90 -mr-1"></span>
                      <span className="w-2 h-2 rounded-full bg-[#F79E1B] inline-block opacity-90"></span>
                    </div>
                    <div className="h-5 px-1.5 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-800">
                      <i className="bi bi-apple text-[10px]"></i>
                      <span>Pay</span>
                    </div>
                    <div className="h-5 px-1.5 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center gap-1 text-[10px] font-bold text-gray-700">
                      <span className="text-[#4285F4]">G</span>
                      <span>Pay</span>
                    </div>
                    <div className="h-5 px-1.5 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center text-[9px] font-extrabold text-[#097939]">
                      <span>UPI</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-[11px] text-gray-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                    <i className="bi bi-truck text-brand-600"></i>
                    <span>Dispatched via BlueDart / Delhivery Express</span>
                  </div>
                  <p className="text-gray-500">
                    Orders over ₹4,999 qualify for complimentary zero-fee surface transit.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};
