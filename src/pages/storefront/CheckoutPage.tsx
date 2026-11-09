import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { PaymentMethod } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { orderRepository } from '../../infrastructure/repositories';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';
import { ShrellLoader } from '../../components/common/ShrellLoader';

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
  const { isDark } = useTheme();
  const navigate = useNavigate();

  React.useEffect(() => {
    finishPageLoad();
    window.scrollTo(0, 0);
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

  // Selected Payment Method (matching reference list)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MANUAL_UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const storeUpiId = import.meta.env.VITE_STORE_UPI_ID || 'shrell@icici';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // If cart is empty, redirect to cart
  if (cart.items.length === 0) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6 ${
        isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
      }`}>
        <div className={`w-20 h-20 rounded-full border flex items-center justify-center mx-auto ${
          isDark ? 'bg-[#130E10] border-[#261619] text-[#8E8587]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#8E8587]'
        }`}>
          <i className="bi bi-bag-x text-3xl" />
        </div>
        <h2 className="text-xl font-bold">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 max-w-xs">
          Please add items to your cart before proceeding to payment checkout.
        </p>
        <Link
          to="/cart"
          className="px-6 py-2.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Return to Cart
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full recipient name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please provide a valid 10-digit Indian mobile number for courier dispatch.');
      return;
    }

    const cleanPin = postalCode.replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Indian Postal PIN code.');
      return;
    }

    if (!addressLine1.trim() || !city.trim()) {
      setErrorMessage('Please provide your complete shipping street address and city.');
      return;
    }

    if (selectedMethod === 'MANUAL_UPI') {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr || cleanUtr.length < 10) {
        setErrorMessage('Please enter the 12-digit UPI UTR transaction reference number after payment.');
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
        postalCode: cleanPin,
        isDefault: true,
      };

      const newOrder = await orderRepository.createOrder({
        customerId: `cust-${cleanPhone}`,
        customerName: fullName.trim(),
        customerEmail: email.trim() || `${cleanPhone}@guest.shrell.com`,
        customerPhone: cleanPhone,
        status: selectedMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        paymentStatus: selectedMethod === 'COD' ? 'PENDING' : 'PENDING',
        paymentMethod: selectedMethod,
        paymentReference: selectedMethod === 'MANUAL_UPI' ? utrNumber.trim() : undefined,
        subtotalPaisa: cart.subtotalPaisa,
        taxPaisa: cart.taxPaisa,
        shippingPaisa: cart.shippingPaisa,
        discountPaisa: cart.discountPaisa,
        totalPaisa: cart.totalPaisa,
        shippingAddress,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        items: itemsSnapshot,
        idempotencyKey,
      });

      clearCart();
      // Navigate to order success screen
      navigate('/order-success', { state: { order: newOrder } });
    } catch (err: any) {
      console.error('Order creation failed:', err);
      // Navigate to order failure or display error
      navigate('/order-failure', { state: { error: err.message || 'Payment transaction failed' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    {
      id: 'RAZORPAY' as PaymentMethod,
      title: 'Credit / Debit cards',
      icon: 'bi-credit-card-2-front',
      badge: 'Cards',
      description: 'Visa, MasterCard, RuPay & Maestro cards accepted',
    },
    {
      id: 'MANUAL_UPI' as PaymentMethod,
      title: 'Pay by any UPI App',
      icon: 'bi-qr-code-scan',
      badge: 'Fast UPI',
      description: 'GPay, PhonePe, Paytm, BHIM & Bank UPI with instant verification',
    },
    {
      id: 'COD' as PaymentMethod,
      title: 'Cash on Delivery',
      icon: 'bi-cash-coin',
      badge: 'COD',
      description: 'Pay cash or UPI upon courier handover at your doorstep',
    },
    {
      id: 'NET_BANKING' as PaymentMethod,
      title: 'Net Banking',
      icon: 'bi-bank',
      badge: '50+ Banks',
      description: 'HDFC, ICICI, SBI, Axis, Kotak and all major Indian banks',
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-36 md:pb-12 space-y-6">

        {/* ========================================================= */}
        {/* TOPBAR (Matching Reference Screen 1: Back | Title | Bag)  */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between pb-3 border-b border-inherit/20">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="Back to Cart"
          >
            <i className="bi bi-arrow-left text-sm" />
          </button>

          <h1 className="text-lg font-bold tracking-tight">Payment Method</h1>

          <Link
            to="/cart"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer relative active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="View Cart"
          >
            <i className="bi bi-bag text-sm" />
            {cart.items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF000E] text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5 leading-none shadow-xs">
                {cart.items.length}
              </span>
            )}
          </Link>
        </div>

        {/* Form Submission Container */}
        <form onSubmit={handleSubmitOrder} className="space-y-6">

          {/* Responsive 2-column on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* LEFT COLUMN: Shipping Address + Payment Methods List (Reference layout) */}
            <div className="md:col-span-7 space-y-6">

              {/* 1. Delivery Address Card (Reduced border radius) */}
              <div className={`p-4 sm:p-5 rounded-xl border space-y-4 ${
                isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-inherit/20">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <i className="bi bi-geo-alt-fill text-[#D0000B]" />
                    <span>Shipping Address</span>
                  </h2>
                  <span className="text-[11px] text-gray-500">Step 1 of 2</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 opacity-80">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                        isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 opacity-80">Mobile Number (10 Digits) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono opacity-60">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="9876543210"
                          className={`w-full rounded-lg pl-12 pr-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                            isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 opacity-80">Postal PIN Code (6 Digits) *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="411001"
                        className={`w-full rounded-lg px-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                          isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 opacity-80">Street Address / Flat / Floor *</label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Flat 402, Signature Residency, Baner Road"
                      className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                        isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 opacity-80">Apartment / Landmark (Optional)</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Near Metro Station"
                        className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                          isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 opacity-80">Email Address (For Invoice)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vikram@example.com"
                        className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                          isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 opacity-80">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Leave with security / Call upon arrival"
                      className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                        isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 opacity-80">City / District *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Pune"
                        className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                          isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 opacity-80">State *</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={`w-full rounded-lg px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                          isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                        }`}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st} className={isDark ? 'bg-[#181113]' : 'bg-white'}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Card List (Matching Screen 1 of Reference) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <i className="bi bi-wallet2 text-[#FF000E]" />
                    <span>Select Payment Method</span>
                  </h2>
                  <span className="text-[11px] text-gray-500">Step 2 of 2</span>
                </div>

                <div className="space-y-2.5">
                  {paymentOptions.map((opt) => {
                    const isSelected = selectedMethod === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedMethod(opt.id)}
                        className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? isDark
                              ? 'bg-[#1A1214] border-[#D0000B] ring-1 ring-[#D0000B]'
                              : 'bg-white border-[#D0000B] ring-1 ring-[#D0000B] shadow-sm'
                            : isDark
                              ? 'bg-[#120E0F] hover:bg-[#161012] border-[#261619]'
                              : 'bg-white hover:bg-[#FDFCFA] border-[#E0DBD2]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-[#D0000B] text-white border-[#D0000B]'
                                : isDark
                                  ? 'bg-[#181113] text-gray-300 border-[#261619]'
                                  : 'bg-[#F5F3EE] text-gray-700 border-[#E0DBD2]'
                            }`}>
                              <i className={`bi ${opt.icon} text-lg`} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-sm block leading-tight">{opt.title}</span>
                              <span className={`text-[11px] block mt-0.5 truncate ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
                                {opt.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <i className={`bi bi-chevron-right text-xs transition-transform ${
                              isSelected ? 'text-[#D0000B] translate-x-0.5' : 'text-gray-400'
                            }`} />
                          </div>
                        </div>

                        {/* UPI Expanded Sub-Section */}
                        {isSelected && opt.id === 'MANUAL_UPI' && (
                          <div className={`mt-3.5 pt-3.5 border-t space-y-3 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`} onClick={(e) => e.stopPropagation()}>
                            <div className={`p-3 rounded-lg border space-y-2 text-xs ${
                              isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-400">Merchant UPI VPA</span>
                                <button
                                  type="button"
                                  onClick={handleCopyUpi}
                                  className="text-[11px] font-bold text-[#D0000B] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="bi bi-clipboard" />
                                  <span>{copiedUpi ? 'Copied!' : 'Copy UPI ID'}</span>
                                </button>
                              </div>
                              <div className="font-mono text-sm font-bold text-[#D0000B]">
                                {storeUpiId}
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Open any UPI App (GPay / PhonePe / Paytm / BHIM) and pay <strong>{formatINR(cart.totalPaisa)}</strong>.
                              </p>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold mb-1 opacity-80">
                                Enter 12-Digit UPI UTR Reference Number *
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={16}
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value.trim())}
                                placeholder="e.g. 431209874521"
                                className={`w-full rounded-lg px-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[#D0000B] ${
                                  isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Cards Sub-Section */}
                        {isSelected && opt.id === 'RAZORPAY' && (
                          <div className={`mt-3.5 pt-3.5 border-t text-xs text-gray-400 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                            <p>Encrypted 256-bit SSL transaction gateway. You will complete verification securely.</p>
                          </div>
                        )}

                        {/* COD Sub-Section */}
                        {isSelected && opt.id === 'COD' && (
                          <div className={`mt-3.5 pt-3.5 border-t text-xs text-gray-400 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                            <p>Order will be verified via SMS/WhatsApp. Handover payment in cash or UPI to courier upon doorstep delivery.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Order Items Snapshot & Price Summary (Desktop Sticky, Reduced Radius) */}
            <div className="md:col-span-5 space-y-4">
              <div className={`p-4 sm:p-5 rounded-xl border space-y-4 md:sticky md:top-24 ${
                isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-inherit/20">
                  <h3 className="font-bold text-sm">Order Summary ({cart.items.length})</h3>
                  <Link to="/cart" className="text-xs text-[#D0000B] hover:underline font-semibold">
                    Edit Cart
                  </Link>
                </div>

                {/* Items List Preview */}
                <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                  {cart.items.map((it) => (
                    <div key={it.productId} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-gray-400 text-[11px] shrink-0">{it.quantity}x</span>
                        <span className="truncate">{it.product.name}</span>
                      </div>
                      <span className="font-mono font-semibold shrink-0">{formatINR(it.subtotalPaisa)}</span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className={`pt-3 border-t space-y-2 text-xs ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sub total</span>
                    <span className="font-semibold">{formatINR(cart.subtotalPaisa)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery Fee</span>
                    <span className="font-semibold">
                      {cart.shippingPaisa === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : formatINR(cart.shippingPaisa)}
                    </span>
                  </div>
                  {cart.discountPaisa > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Voucher</span>
                      <span className="font-semibold">−{formatINR(cart.discountPaisa)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] opacity-70">
                    <span>GST (18% Included)</span>
                    <span className="font-mono">{formatINR(cart.taxPaisa)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className={`pt-3 border-t flex justify-between items-center ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                  <span className="font-bold text-base">Total Payable</span>
                  <span className="font-extrabold text-xl font-tight text-[#D0000B]">
                    {formatINR(cart.totalPaisa)}
                  </span>
                </div>

                {/* Desktop Submit Button (Reduced Radius) */}
                <div className="hidden md:block pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#D0000B] hover:bg-[#B0000A] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <ShrellLoader size={18} white />
                        <span>Processing Order...</span>
                      </div>
                    ) : (
                      <span>Add Payment Method &amp; Place Order</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* MOBILE STICKY BOTTOM BUTTON (Matching Screen 1 Reference) */}
          {/* ========================================================= */}
          <div className={`fixed bottom-0 left-0 right-0 z-30 md:hidden p-4 border-t backdrop-blur-xl transition-all ${
            isDark ? 'bg-[#0A0808]/95 border-[#261619] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]' : 'bg-white/95 border-[#E0DBD2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
          }`}>
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Payable</span>
                <span className="font-extrabold text-base text-[#D0000B] font-tight">{formatINR(cart.totalPaisa)}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#D0000B] hover:bg-[#B0000A] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <ShrellLoader size={18} white />
                    <span>Processing Order...</span>
                  </div>
                ) : (
                  <span>Add Payment Method</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
