import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { useAuth } from '../../application/AuthContext';
import { PaymentMethod } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { orderRepository } from '../../infrastructure/repositories';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { StateSearchDropdown } from '../../components/checkout/StateSearchDropdown';
import { CheckoutFlowTopBar } from '../../components/checkout/CheckoutFlowTopBar';
import { usePostalPincode } from '../../hooks/usePostalPincode';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import {
  trackCheckoutStarted,
  trackCheckoutStepCompleted,
  trackPaymentAttempted,
  trackOrderCompleted,
} from '../../infrastructure/analytics/posthog';

type CheckoutStep = 'address' | 'payment';

const COUNTRY_DIAL_CODES = [
  { code: 'IN', dial: '+91', label: 'India' },
  { code: 'US', dial: '+1', label: 'United States' },
  { code: 'AE', dial: '+971', label: 'UAE' },
  { code: 'GB', dial: '+44', label: 'United Kingdom' },
  { code: 'SG', dial: '+65', label: 'Singapore' },
  { code: 'AU', dial: '+61', label: 'Australia' },
  { code: 'CA', dial: '+1', label: 'Canada' },
  { code: 'DE', dial: '+49', label: 'Germany' },
  { code: 'SA', dial: '+966', label: 'Saudi Arabia' },
  { code: 'QA', dial: '+974', label: 'Qatar' },
  { code: 'OM', dial: '+968', label: 'Oman' },
  { code: 'KW', dial: '+965', label: 'Kuwait' },
  { code: 'BH', dial: '+973', label: 'Bahrain' },
  { code: 'MY', dial: '+60', label: 'Malaysia' },
  { code: 'JP', dial: '+81', label: 'Japan' },
];

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab / Step resolution: 'address' (Step 1), 'payment' (Step 2)
  const rawStep = searchParams.get('step');
  const currentStep: CheckoutStep =
    rawStep === 'payment' || rawStep === 'summary' ? 'payment' : 'address';

  useEffect(() => {
    finishPageLoad();
    window.scrollTo(0, 0);
    trackCheckoutStarted(cart, currentStep);
  }, [finishPageLoad, currentStep]);

  // Check if an email is a legitimate user email (not an auto-generated internal string)
  const isRealEmail = (em?: string): boolean => {
    if (!em || !em.trim()) return false;
    const lower = em.toLowerCase();
    return (
      !lower.includes('@customer.shrell.com') &&
      !lower.includes('@guest.shrell.com') &&
      !lower.includes('@internal')
    );
  };

  // Form Fields - Auto-fill from logged in user details ONLY if valid
  const [fullName, setFullName] = useState(() => (user?.name && user.name !== 'Valued Customer' ? user.name : ''));
  const [countryOption, setCountryOption] = useState('IN:+91');
  const countryDialCode = countryOption.split(':')[1] || '+91';
  const [phone, setPhone] = useState(() => {
    if (user?.phone) {
      const clean = user.phone.replace(/[^0-9]/g, '');
      return clean.slice(-10);
    }
    return '';
  });
  const isPhoneAutofilled = Boolean(
    user?.phone &&
      phone.length === 10 &&
      phone === user.phone.replace(/[^0-9]/g, '').slice(-10)
  );
  const [email, setEmail] = useState(() => (isRealEmail(user?.email) ? user!.email : ''));
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Track last autofilled city so changing PIN always updates District / City accurately
  const lastAutoCityRef = useRef<string>('');

  // Non-blocking Postal PIN autofill hook for Indian PIN codes
  const { loading: isPinLoading, data: pinData } = usePostalPincode(postalCode, {
    onLookupSuccess: ({ city: autoCity, state: autoState, isFallback }) => {
      if (autoCity && (!city || city === lastAutoCityRef.current || !isFallback)) {
        setCity(autoCity);
        lastAutoCityRef.current = autoCity;
      }
      if (autoState) {
        setState(autoState);
      }
    },
  });

  // Auto-sync when user session updates asynchronously
  useEffect(() => {
    if (user) {
      if (user.phone && !phone) {
        const clean = user.phone.replace(/[^0-9]/g, '');
        setPhone(clean.slice(-10));
      }
      if (user.name && user.name !== 'Valued Customer' && !fullName) {
        setFullName(user.name);
      }
      if (isRealEmail(user.email) && !email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  // Selected Payment Method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MANUAL_UPI');
  const [customerUpiId, setCustomerUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clean UPI ID configuration - no hardcoded demo fallback
  const storeUpiId = import.meta.env.VITE_STORE_UPI_ID || '';

  const handleCopyUpi = () => {
    if (!storeUpiId) return;
    navigator.clipboard.writeText(storeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // If cart is empty, redirect to cart
  if (cart.items.length === 0) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6 pb-20 ${
        isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
      }`}>
        <div className={`w-20 h-20 rounded-full border flex items-center justify-center mx-auto ${
          isDark ? 'bg-[#130E10] border-[#261619] text-[#8E8587]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#8E8587]'
        }`}>
          <i className="bi bi-bag-x text-3xl" />
        </div>
        <h2 className="text-xl font-bold">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 max-w-xs">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <span>Return to Cart</span>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <i className="bi bi-arrow-right text-[10px]" />
          </span>
        </Link>
      </div>
    );
  }

  // Address Validation Helper
  const validateAddress = (): boolean => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full recipient name.');
      return false;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (countryDialCode === '+91' ? cleanPhone.length !== 10 : cleanPhone.length < 6 || cleanPhone.length > 15) {
      setErrorMessage(
        countryDialCode === '+91'
          ? 'Please provide a valid 10-digit Indian mobile number for courier dispatch.'
          : 'Please provide a valid mobile number for courier dispatch.'
      );
      return false;
    }
    const cleanPin = postalCode.replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Indian Postal PIN code.');
      return false;
    }
    if (!addressLine1.trim() || !city.trim()) {
      setErrorMessage('Please provide your complete shipping street address and city.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Navigate to Step 2 (Payment) from Step 1
  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAddress()) return;
    trackCheckoutStepCompleted('address', { city: city.trim(), state, postalCode: postalCode.trim() });
    setSearchParams({ step: 'payment' });
  };

  // Submit Final Order directly from Step 2 (Payment Method)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateAddress()) {
      setSearchParams({ step: 'address' });
      return;
    }

    trackCheckoutStepCompleted('payment', { paymentMethod: selectedMethod });

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = countryDialCode === '+91' ? cleanPhone : `${countryDialCode}${cleanPhone}`;
    const cleanPin = postalCode.replace(/[^0-9]/g, '');

    trackPaymentAttempted(selectedMethod, cart.totalPaisa);
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
        phone: formattedPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        district: city.trim(),
        state,
        postalCode: cleanPin,
        isDefault: true,
      };

      const paymentReference = selectedMethod === 'MANUAL_UPI'
        ? (utrNumber.trim() || customerUpiId.trim() || undefined)
        : undefined;

      const newOrder = await orderRepository.createOrder({
        customerId: `cust-${cleanPhone}`,
        customerName: fullName.trim(),
        customerEmail: email.trim() || `${cleanPhone}@guest.shrell.com`,
        customerPhone: formattedPhone,
        status: selectedMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        paymentStatus: selectedMethod === 'COD' ? 'PENDING' : 'PENDING',
        paymentMethod: selectedMethod,
        paymentReference,
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

      trackOrderCompleted(newOrder);
      clearCart();
      navigate('/order-success', { state: { order: newOrder } });
    } catch (err: any) {
      console.error('Order creation failed:', err);
      navigate('/order-failure', { state: { error: err.message || 'Payment transaction failed' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    {
      id: 'RAZORPAY' as PaymentMethod,
      title: 'Credit/Debit cards',
      icon: 'bi-credit-card-2-front',
      badge: 'Cards',
      description: 'Visa, MasterCard, RuPay & Maestro cards accepted',
    },
    {
      id: 'MANUAL_UPI' as PaymentMethod,
      title: 'Paypal',
      icon: 'bi-paypal',
      badge: 'Digital Wallet',
      description: 'Instant global and domestic wallet processing',
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
      id: 'RAZORPAY' as PaymentMethod,
      title: 'Net Banking',
      icon: 'bi-bank',
      badge: '50+ Banks',
      description: 'HDFC, ICICI, SBI, Axis, Kotak and all major Indian banks',
    },
  ];

  const getPageTitle = () => {
    switch (currentStep) {
      case 'address':
        return 'Delivery Address';
      case 'payment':
        return 'Payment Method';
      default:
        return 'Checkout';
    }
  };

  const handleBackNavigation = () => {
    if (currentStep === 'payment') {
      setSearchParams({ step: 'address' });
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <SEOHead
        title="Secure Checkout | SHRELL Automotive"
        description="Complete your order securely with UPI, Cards, Netbanking or Cash on Delivery."
        noIndex={true}
      />
      {/* Topbar Header (Shared exact position across My Cart & Checkout steps, no cart button) */}
      <CheckoutFlowTopBar
        title={getPageTitle()}
        onBack={handleBackNavigation}
        backLabel="Back"
      />

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-32 sm:pb-36 md:pb-12 space-y-4">

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: DELIVERY ADDRESS TAB (No card container, direct form fields)       */}
        {/* ========================================================================= */}
        {currentStep === 'address' && (
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            <div className="space-y-3.5">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 opacity-80">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder=""
                    className={`w-full rounded-lg px-3.5 py-3 text-[13px] border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                      isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 opacity-80">
                      Mobile Number *
                    </label>
                    <div className="flex items-stretch gap-2">
                      <div className="relative shrink-0">
                        <select
                          aria-label="Country code"
                          value={countryOption}
                          onChange={(e) => setCountryOption(e.target.value)}
                          className={`appearance-none h-full rounded-lg pl-3 pr-7 py-3 text-[13px] font-mono border focus:outline-none focus:ring-2 focus:ring-[#FF000E] cursor-pointer ${
                            isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                          }`}
                        >
                          {COUNTRY_DIAL_CODES.map((c) => (
                            <option
                              key={c.code}
                              value={`${c.code}:${c.dial}`}
                              className={isDark ? 'bg-[#0E0A0B] text-white' : 'bg-white text-[#140E10]'}
                            >
                              {c.code} {c.dial}
                            </option>
                          ))}
                        </select>
                        <i
                          className="bi bi-chevron-down text-[10px] text-gray-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="tel"
                          inputMode="numeric"
                          required
                          maxLength={countryDialCode === '+91' ? 10 : 15}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder=""
                          className={`w-full rounded-lg pl-3.5 ${isPhoneAutofilled ? 'pr-10' : 'pr-3.5'} py-3 text-[13px] font-mono border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                            isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                          }`}
                        />
                        {isPhoneAutofilled && (
                          <span
                            title="Auto-filled from your account"
                            aria-label="Phone number auto-filled"
                            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${
                              isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'
                            }`}
                          >
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 block"
                              aria-hidden="true"
                            >
                              <path d="M3.2 8.4L6.4 11.6L12.8 4.4" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 opacity-80">
                      Email Address (Optional)
                      {isRealEmail(user?.email) && email === user?.email && (
                        <span className="ml-1.5 text-emerald-500 font-normal text-[10px]">(Auto-filled)</span>
                      )}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className={`w-full rounded-lg px-3.5 py-3 text-[13px] border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                        isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <div className="min-h-[20px] flex items-center mb-1">
                      <label className="block text-[11px] font-semibold opacity-80 whitespace-nowrap">PIN Code *</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={6}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder=""
                        className={`w-full rounded-lg pl-3.5 ${isPinLoading || pinData ? 'pr-10' : 'pr-3.5'} py-3 text-[13px] font-mono border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                          isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                        }`}
                      />
                      {isPinLoading && (
                        <span
                          aria-label="Looking up PIN code"
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center"
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${
                              isDark ? 'border-[#F1EEEE]' : 'border-[#140E10]'
                            }`}
                          />
                        </span>
                      )}
                      {!isPinLoading && pinData && (
                        <span
                          title={`Location resolved: ${pinData.city}, ${pinData.state}`}
                          aria-label="PIN code location resolved"
                          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${
                            isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'
                          }`}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 block"
                            aria-hidden="true"
                          >
                            <path d="M3.2 8.4L6.4 11.6L12.8 4.4" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="min-h-[20px] flex items-center mb-1">
                      <label className="block text-[11px] font-semibold opacity-80 whitespace-nowrap">District / City *</label>
                    </div>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder=""
                      className={`w-full rounded-lg px-3.5 py-3 text-[13px] border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                        isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 opacity-80">Street Address / House / Flat *</label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder=""
                    className={`w-full rounded-lg px-3.5 py-3 text-[13px] border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                      isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 opacity-80">Apartment / Area / Landmark (Optional)</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder=""
                      className={`w-full rounded-lg px-3.5 py-3 text-[13px] border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                        isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                      }`}
                    />
                  </div>

                  <div>
                    <StateSearchDropdown value={state} onChange={setState} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 opacity-80">Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder=""
                    className={`w-full rounded-lg px-3.5 py-3 text-[13px] border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                      isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Step 1 CTA Button (In-flow) */}
            <div className="hidden md:block pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Payment Method</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <i className="bi bi-arrow-right text-[10px]" />
                </span>
              </button>
            </div>

            {/* Mobile Fixed Bottom CTA Button (Flush above dock text carousel) */}
            <div
              className={`fixed left-0 right-0 z-50 md:hidden py-2 px-3 border-t backdrop-blur-xl transition-all ${
                isDark
                  ? 'bg-[#0A0808]/95 border-[#2D161A] shadow-[0_-8px_25px_rgba(0,0,0,0.85)]'
                  : 'bg-white/95 border-[#D0C9BE] shadow-[0_-4px_18px_rgba(0,0,0,0.1)]'
              }`}
              style={{ bottom: 'var(--mobile-dock-height, 70px)' }}
            >
              <div className="max-w-xl mx-auto">
                <button
                  type="submit"
                  className="w-full h-11 px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment Method</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <i className="bi bi-arrow-right text-[10px]" />
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PAYMENT METHOD TAB (Submits directly to Payment Success)          */}
        {/* ========================================================================= */}
        {currentStep === 'payment' && (
          <form onSubmit={handleSubmitOrder} className="space-y-3.5">

            {/* Address Recap Chip */}
            <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <i className="bi bi-geo-alt-fill text-[#FF000E] shrink-0" />
                <span className="truncate">
                  Deliver to: <strong>{fullName || 'Recipient'}</strong> {phone && `(${countryDialCode} ${phone})`}{addressLine1 && `, ${addressLine1}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({ step: 'address' })}
                className="text-xs font-semibold text-[#FF000E] hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Payment Method Cards List (Pure list from Reference Screen 1) */}
            <div className="space-y-2">
              {paymentOptions.map((opt) => {
                const isSelected =
                  (opt.title === 'Credit/Debit cards' && selectedMethod === 'RAZORPAY') ||
                  (opt.title === 'Pay by any UPI App' && selectedMethod === 'MANUAL_UPI') ||
                  (opt.title === 'Cash on Delivery' && selectedMethod === 'COD') ||
                  (opt.title === 'Net Banking' && selectedMethod === 'RAZORPAY') ||
                  (opt.title === 'Paypal' && selectedMethod === 'MANUAL_UPI');

                return (
                  <div
                    key={opt.title}
                    onClick={() => setSelectedMethod(opt.id)}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1A1214] border-[#FF000E] ring-1 ring-[#FF000E]'
                          : 'bg-white border-[#FF000E] ring-1 ring-[#FF000E] shadow-sm'
                        : isDark
                          ? 'bg-[#120E0F] hover:bg-[#161012] border-[#261619]'
                          : 'bg-white hover:bg-[#FDFCFA] border-[#E0DBD2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#FF000E] text-white border-[#FF000E]'
                            : isDark
                              ? 'bg-[#181113] text-gray-300 border-[#261619]'
                              : 'bg-[#F5F3EE] text-gray-700 border-[#E0DBD2]'
                        }`}>
                          <i className={`bi ${opt.icon} text-base`} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm block leading-tight">{opt.title}</span>
                          <span className={`text-[10.5px] block mt-0.5 truncate ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
                            {opt.description}
                          </span>
                        </div>
                      </div>

                      {/* Arrow with round background */}
                      <div className="shrink-0 ml-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#FF000E] text-white'
                            : isDark
                              ? 'bg-white/10 text-gray-300'
                              : 'bg-black/5 text-gray-600'
                        }`}>
                          <i className="bi bi-chevron-right text-[10px]" />
                        </span>
                      </div>
                    </div>

                    {/* Pay by any UPI App sub-inputs */}
                    {isSelected && opt.title === 'Pay by any UPI App' && (
                      <div className={`mt-3 pt-3 border-t space-y-2.5 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`} onClick={(e) => e.stopPropagation()}>
                        {storeUpiId && (
                          <div className={`p-2.5 rounded-lg border space-y-1.5 text-xs ${
                            isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-400 text-[11px]">Store UPI ID</span>
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="text-[11px] font-bold text-[#FF000E] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <i className="bi bi-clipboard" />
                                <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <div className="font-mono text-sm font-bold text-[#FF000E]">
                              {storeUpiId}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold mb-1 opacity-80">
                            Your UPI ID / VPA
                          </label>
                          <input
                            type="text"
                            value={customerUpiId}
                            onChange={(e) => setCustomerUpiId(e.target.value.trim())}
                            placeholder=""
                            className={`w-full rounded-lg px-3.5 py-2.5 text-[13px] font-mono border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                              isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1 opacity-80">
                            UPI Transaction UTR Reference Number
                          </label>
                          <input
                            type="text"
                            maxLength={16}
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.trim())}
                            placeholder=""
                            className={`w-full rounded-lg px-3.5 py-2.5 text-[13px] font-mono border focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                              isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Step 2 CTA Button */}
            <div className="hidden md:block pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <ShrellLoader size={18} white />
                    <span>Processing Order...</span>
                  </div>
                ) : (
                  <>
                    <span>Proceed to Pay ({formatINR(cart.totalPaisa)})</span>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <i className="bi bi-arrow-right text-[10px]" />
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Fixed Bottom CTA Button (Flush above dock text carousel) */}
            <div
              className={`fixed left-0 right-0 z-50 md:hidden py-2 px-3 border-t backdrop-blur-xl transition-all ${
                isDark
                  ? 'bg-[#0A0808]/95 border-[#2D161A] shadow-[0_-8px_25px_rgba(0,0,0,0.85)]'
                  : 'bg-white/95 border-[#D0C9BE] shadow-[0_-4px_18px_rgba(0,0,0,0.1)]'
              }`}
              style={{ bottom: 'var(--mobile-dock-height, 70px)' }}
            >
              <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 block leading-tight">Total</span>
                  <span className={`font-extrabold text-sm font-tight block leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                    {formatINR(cart.totalPaisa)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-1.5">
                      <ShrellLoader size={16} white />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span>Proceed to Pay</span>
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <i className="bi bi-arrow-right text-[10px]" />
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
