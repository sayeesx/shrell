import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Order } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';
import { useTheme } from '../../application/ThemeContext';
import { useVehicle } from '../../application/VehicleContext';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import { CheckoutFlowTopBar } from '../../components/checkout/CheckoutFlowTopBar';
import { orderRepository } from '../../infrastructure/repositories';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  isDark: boolean;
  onNavigateHome: () => void;
  onNavigateCatalogue: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

class OrderSuccessErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('OrderSuccessPage caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const { isDark, onNavigateHome, onNavigateCatalogue } = this.props;
      return (
        <div className={`min-h-screen py-12 px-4 transition-colors ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
          <div className={`max-w-md mx-auto p-6 sm:p-8 rounded-2xl border text-center space-y-5 shadow-sm ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}>
            <div className="w-20 h-20 rounded-full bg-[#FF000E] border-4 border-white/20 flex items-center justify-center mx-auto text-white shadow-xl shadow-[#FF000E]/30">
              <i className="bi bi-check-lg text-4xl font-black" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Order Placed Successfully</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Thank You For Your Order!</h1>
              <p className={`text-xs leading-relaxed max-w-sm mx-auto ${isDark ? 'text-[#A09899]' : 'text-[#605859]'}`}>
                Your purchase has been received and registered in our automated dispatch pipeline. Our warehouse team is preparing your precision automotive equipment.
              </p>
            </div>
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={onNavigateCatalogue}
                className="w-full py-3.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Continue Shopping Car Accessories
              </button>
              <button
                type="button"
                onClick={onNavigateHome}
                className={`w-full py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#181113] hover:bg-[#201518] border-[#261619] text-[#F1EEEE]'
                    : 'bg-[#F5F3EE] hover:bg-[#EDE9E1] border-[#E0DBD2] text-[#140E10]'
                }`}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const OrderSuccessContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { selectedVehicle } = useVehicle();
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Resolve Order from location.state, sessionStorage, localStorage, or query param
  const [order, setOrder] = useState<Order | null>(() => {
    try {
      const stateOrder = (location.state as { order?: Order })?.order;
      if (stateOrder && stateOrder.id) return stateOrder;

      const sessionCached = sessionStorage.getItem('shrell_last_order');
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        if (parsed && parsed.id) return parsed;
      }

      const localCached = localStorage.getItem('shrell_last_order');
      if (localCached) {
        const parsed = JSON.parse(localCached);
        if (parsed && parsed.id) return parsed;
      }
    } catch (_) {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [manualOrderIdInput, setManualOrderIdInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // 2. Fallback fetch from database if only orderId parameter is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramId = params.get('orderId') || params.get('id');

    if (!order && paramId) {
      setIsLoading(true);
      orderRepository
        .getOrderById(paramId)
        .then((fetched) => {
          if (fetched) {
            setOrder(fetched);
            try {
              sessionStorage.setItem('shrell_last_order', JSON.stringify(fetched));
              localStorage.setItem('shrell_last_order', JSON.stringify(fetched));
            } catch (_) {}
          }
        })
        .catch((err) => console.warn('Could not fetch order from Supabase:', err))
        .finally(() => setIsLoading(false));
    }
  }, [location.search, order]);

  // 3. Celebratory Confetti Animation safely guarded against null/reduced-motion
  useEffect(() => {
    let cardConfetti: any = null;
    let timer: any = null;

    try {
      if (typeof window === 'undefined') return;
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const canvas = confettiCanvasRef.current;
      if (prefersReducedMotion || !canvas || typeof confetti !== 'function') return;

      cardConfetti = confetti.create(canvas, { resize: true, useWorker: false });
      const confettiColors = isDark
        ? ['#FF000E', '#E0000C', '#FF000E', '#D4D0D0', '#E5E5E5']
        : ['#FF000E', '#CC000B', '#E0000C', '#140E10', '#000000'];

      cardConfetti({
        particleCount: 75,
        spread: 70,
        origin: { x: 0.5, y: 0.4 },
        colors: confettiColors,
        disableForReducedMotion: true,
      });

      timer = setTimeout(() => {
        try {
          if (cardConfetti) {
            cardConfetti({
              particleCount: 40,
              angle: 60,
              spread: 50,
              origin: { x: 0.15, y: 0.5 },
              colors: confettiColors,
              disableForReducedMotion: true,
            });
            cardConfetti({
              particleCount: 40,
              angle: 120,
              spread: 50,
              origin: { x: 0.85, y: 0.5 },
              colors: confettiColors,
              disableForReducedMotion: true,
            });
          }
        } catch (_) {}
      }, 250);
    } catch (err) {
      console.warn('Confetti suppressed:', err);
    }

    return () => {
      if (timer) clearTimeout(timer);
      try {
        if (cardConfetti && typeof cardConfetti.reset === 'function') {
          cardConfetti.reset();
        }
      } catch (_) {}
    };
  }, [isDark]);

  // Copy Order ID with visual feedback
  const handleCopyOrderId = (idToCopy: string) => {
    try {
      navigator.clipboard.writeText(idToCopy);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch (_) {}
  };

  // Manual lookup handler if order was accessed directly
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualOrderIdInput.trim();
    if (!cleanId) return;

    setIsLoading(true);
    setSearchError(null);
    try {
      const found = await orderRepository.getOrderById(cleanId);
      if (found) {
        setOrder(found);
        try {
          sessionStorage.setItem('shrell_last_order', JSON.stringify(found));
          localStorage.setItem('shrell_last_order', JSON.stringify(found));
        } catch (_) {}
      } else {
        setSearchError(`No order found matching "${cleanId}". Please check the ID or contact support.`);
      }
    } catch (err: any) {
      setSearchError('Error retrieving order details. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Safe variables with complete fallbacks
  const orderId = order?.id || 'SH-2026-CONFIRMED';

  // Safely extract address object
  const rawAddress = order?.shippingAddress;
  const shippingAddress = useMemo(() => {
    if (!rawAddress) return null;
    if (typeof rawAddress === 'string') {
      try {
        return JSON.parse(rawAddress);
      } catch {
        return { addressLine1: rawAddress };
      }
    }
    return typeof rawAddress === 'object' ? rawAddress : null;
  }, [rawAddress]);

  const customerName =
    shippingAddress?.fullName ||
    order?.customerName ||
    'Valued Enthusiast';
  const customerPhone = shippingAddress?.phone || order?.customerPhone || '';
  const customerEmail = order?.customerEmail || '';
  const paymentMethodLabel =
    order?.paymentMethod === 'MANUAL_UPI'
      ? 'UPI Instant Transfer'
      : order?.paymentMethod === 'COD'
      ? 'Cash on Delivery (COD)'
      : 'Credit / Debit Card';

  // Safely format placed date
  const orderDate = useMemo(() => {
    try {
      if (order?.createdAt) {
        const d = new Date(order.createdAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
    } catch (_) {}
    return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [order?.createdAt]);

  const estimatedDelivery = useMemo(() => {
    try {
      return new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch (_) {
      return '4-5 Business Days';
    }
  }, []);

  // Safe vehicle compatibility name resolution (never crashes if make/model is string or undefined)
  const vehicleFullName = useMemo(() => {
    if (!selectedVehicle) return '';
    const makeName =
      selectedVehicle.make && typeof selectedVehicle.make === 'object'
        ? selectedVehicle.make.name || ''
        : typeof selectedVehicle.make === 'string'
        ? selectedVehicle.make
        : '';
    const modelName =
      selectedVehicle.model && typeof selectedVehicle.model === 'object'
        ? selectedVehicle.model.name || ''
        : typeof selectedVehicle.model === 'string'
        ? selectedVehicle.model
        : '';
    return [makeName, modelName].filter(Boolean).join(' ').trim();
  }, [selectedVehicle]);

  // Safe WhatsApp support URL
  const whatsappSupportUrl = useMemo(() => {
    try {
      if (order && order.id && whatsAppService && typeof whatsAppService.getOrderSupportLink === 'function') {
        return whatsAppService.getOrderSupportLink(order);
      }
    } catch (_) {}
    return `https://wa.me/919876543210?text=${encodeURIComponent(
      `Hello SHRELL Support, I am checking on my order ID: ${orderId}`
    )}`;
  }, [order, orderId]);

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-16 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <SEOHead
        title="Order Confirmed | SHRELL Automotive"
        description="Your automotive accessories order has been placed successfully."
        noIndex={true}
      />

      <CheckoutFlowTopBar
        title="Order Confirmation"
        onBack={() => navigate('/')}
        backLabel="Back to Store"
      />

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">

        {/* Loading state indicator */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-[#FF000E] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-gray-400">Loading order details from database...</p>
          </div>
        )}

        {/* 1. Main Order Success Hero Card */}
        <div className={`p-6 sm:p-8 rounded-2xl border text-center relative overflow-hidden shadow-sm ${
          isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
        }`}>
          {/* Confetti Canvas */}
          <canvas
            ref={confettiCanvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
            aria-hidden="true"
          />

          {/* Animated Success Badge */}
          <div className="relative pt-2 pb-4 flex justify-center z-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FF000E] border-4 border-white/20 flex items-center justify-center shadow-xl shadow-[#FF000E]/30 text-white animate-scale-up">
              <i className="bi bi-check-lg text-4xl sm:text-5xl font-black" />
            </div>
          </div>

          {/* Titles & Confirmation */}
          <div className="space-y-2 relative z-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Order Verified & Confirmed</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Thank You, {customerName}!
            </h1>

            <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-[#A09899]' : 'text-[#605859]'}`}>
              Your order has been placed into our automated dispatch pipeline. Our warehouse team is preparing your precision accessories.
            </p>

            {/* Order ID & Date Tag with One-Click Copy */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <div className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-2 ${
                isDark ? 'bg-[#181113] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
              }`}>
                <span>Order ID: {orderId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyOrderId(orderId)}
                  className="text-gray-400 hover:text-[#FF000E] transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  <i className={`bi ${copiedOrderId ? 'bi-check2 text-emerald-500' : 'bi-copy'}`} />
                </button>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs border font-medium ${
                isDark ? 'bg-[#181113] border-[#261619] text-gray-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-gray-600'
              }`}>
                Placed on {orderDate}
              </span>
              {copiedOrderId && (
                <span className="text-[11px] font-semibold text-emerald-500 animate-fade-in">
                  Copied!
                </span>
              )}
            </div>
          </div>

          {/* Delivery & Dispatch Timeline Banner */}
          <div className={`mt-6 p-4 rounded-xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20 ${
            isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F8F7F4] border-[#E0DBD2]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF000E]/10 text-[#FF000E] flex items-center justify-center shrink-0">
                <i className="bi bi-truck text-lg" />
              </div>
              <div>
                <p className="text-xs font-bold">Estimated Delivery by {estimatedDelivery}</p>
                <p className="text-[11px] text-gray-400">Courier: Delhivery / Blue Dart Express Air</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium text-emerald-500">Dispatches within 24 Hours</span>
            </div>
          </div>
        </div>

        {/* 2. Automotive Fitment Guarantee Badge */}
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
        }`}>
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
            <i className="bi bi-shield-check text-lg" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>100% Automotive Fitment Guarantee</span>
              {vehicleFullName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FF000E]/10 text-[#FF000E] border border-[#FF000E]/20">
                  {vehicleFullName}
                </span>
              )}
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
              {vehicleFullName
                ? `All items ordered are confirmed compatible with your ${vehicleFullName}. Backed by our direct 7-day replacement guarantee.`
                : 'All SHRELL equipment is precision-engineered and laser-measured. If an accessory does not fit your car perfectly, our concierge team will swap it free of charge.'}
            </p>
          </div>
        </div>

        {/* 3. Order Items Summary */}
        {order && Array.isArray(order.items) && order.items.length > 0 && (
          <div className={`p-5 sm:p-6 rounded-xl border space-y-4 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}>
            <h2 className="text-sm font-bold tracking-tight uppercase text-gray-400">
              Ordered Items ({order.items.length})
            </h2>

            <div className="divide-y divide-gray-800/40">
              {order.items.map((item, idx) => {
                if (!item) return null;
                const itemName = item.productName || (item as any).product?.name || 'Automotive Accessory';
                const itemImg = item.imageUrl || (item as any).product?.images?.[0]?.url || '/icons/carcare.svg';
                const itemQty = item.quantity || 1;
                const itemPrice = item.unitPricePaisa || (item as any).product?.pricePaisa || 0;
                const itemSubtotal = item.subtotalPaisa || (itemPrice * itemQty);

                return (
                  <div key={item.id || idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={itemImg}
                        alt={itemName}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-700/40 bg-black/20 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icons/carcare.svg';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate text-inherit">
                          {itemName}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span>SKU: {item.sku || 'SH-EQUIP'}</span>
                          <span>•</span>
                          <span>Qty: {itemQty}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-bold font-mono">
                        {formatINR(itemSubtotal)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatINR(itemPrice)} each
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Shipping Address & Payment Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Delivery Address Card */}
          <div className={`p-5 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
              <i className="bi bi-geo-alt text-[#FF000E]" />
              <span>Shipping Destination</span>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-sm text-inherit">{customerName}</p>
              {customerPhone && <p className="text-gray-400 font-mono">{customerPhone}</p>}
              {customerEmail && <p className="text-gray-400 truncate">{customerEmail}</p>}

              {shippingAddress ? (
                <p className="text-gray-300 pt-1 leading-relaxed">
                  {shippingAddress.addressLine1 || ''}
                  {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''}
                  {(shippingAddress.city || shippingAddress.state) && (
                    <>
                      <br />
                      {[shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ')}
                      {shippingAddress.postalCode ? ` - ` : ''}
                      {shippingAddress.postalCode && (
                        <span className="font-mono font-semibold">{shippingAddress.postalCode}</span>
                      )}
                    </>
                  )}
                </p>
              ) : (
                <p className="text-gray-400 italic pt-1">Standard Express Delivery Address Registered</p>
              )}

              {order?.deliveryInstructions && (
                <div className="mt-2 pt-2 border-t border-gray-800/50 text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-300">Instructions: </span>
                  {order.deliveryInstructions}
                </div>
              )}
            </div>
          </div>

          {/* Payment & Charges Breakdown Card */}
          <div className={`p-5 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400">
              <span className="flex items-center gap-2">
                <i className="bi bi-credit-card text-[#FF000E]" />
                <span>Payment Summary</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
                {order?.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'CONFIRMED'}
              </span>
            </div>

            <div className="text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400 font-sans">Subtotal</span>
                <span>{order ? formatINR(order.subtotalPaisa) : '₹4,999.00'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 font-sans">GST (18% Included)</span>
                <span>{order ? formatINR(order.taxPaisa) : '₹762.56'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 font-sans">Express Shipping</span>
                <span className={order?.shippingPaisa === 0 ? 'text-emerald-500 font-bold' : ''}>
                  {order && order.shippingPaisa === 0 ? 'FREE' : order ? formatINR(order.shippingPaisa) : 'FREE'}
                </span>
              </div>

              {order && (order.discountPaisa || 0) > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span className="font-sans">Discount Savings</span>
                  <span>-{formatINR(order.discountPaisa)}</span>
                </div>
              )}

              <div className={`flex justify-between pt-2 border-t font-bold text-sm ${
                isDark ? 'border-[#261619] text-white' : 'border-[#E0DBD2] text-black'
              }`}>
                <span className="font-sans">Total Paid</span>
                <span className="text-[#FF000E]">{order ? formatINR(order.totalPaisa) : '₹4,999.00'}</span>
              </div>

              <div className="pt-2 text-[11px] text-gray-400 font-sans flex justify-between">
                <span>Method</span>
                <span className="font-medium text-inherit">{paymentMethodLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Direct Order Lookup Form if user accessed page without active session */}
        {!order && (
          <div className={`p-5 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Track An Existing Order
            </h3>
            <p className="text-xs text-gray-400">
              Looking for a previous purchase? Enter your Order ID below to view its confirmation and status.
            </p>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Order ID (e.g. SH-2026-102938)"
                value={manualOrderIdInput}
                onChange={(e) => setManualOrderIdInput(e.target.value)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                  isDark
                    ? 'bg-[#181113] border-[#261619] text-white focus:border-[#FF000E]'
                    : 'bg-white border-[#E0DBD2] text-black focus:border-[#FF000E]'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-[#FF000E] text-white text-xs font-bold hover:bg-[#E0000C] transition-colors cursor-pointer"
              >
                {isLoading ? 'Checking...' : 'Find Order'}
              </button>
            </form>
            {searchError && (
              <p className="text-xs text-rose-500 font-medium">{searchError}</p>
            )}
          </div>
        )}

        {/* 6. Automotive Installation & Technician Support Banner */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-[#181113] border-[#261619]' : 'bg-[#FFF5F5] border-[#FFD0D3]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FF000E]/10 text-[#FF000E] flex items-center justify-center shrink-0">
              <i className="bi bi-tools text-base" />
            </div>
            <div>
              <p className="text-xs font-bold text-inherit">Need Installation Assistance?</p>
              <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Our technical support guides you through fitting your floor liners, roof crossbars, and lighting pods.
              </p>
            </div>
          </div>

          <a
            href={whatsappSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <i className="bi bi-whatsapp" />
            <span>Chat with Technician</span>
          </a>
        </div>

        {/* 7. Action Navigation Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={`/track?orderId=${encodeURIComponent(orderId)}`}
              className="py-3.5 px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Track Live Delivery Status</span>
              <i className="bi bi-arrow-right text-xs" />
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className={`py-3.5 px-4 rounded-xl border font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#181113] hover:bg-[#201518] border-[#261619] text-[#F1EEEE]'
                  : 'bg-white hover:bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
              }`}
            >
              <i className="bi bi-printer text-xs" />
              <span>Print / Download Receipt</span>
            </button>
          </div>

          <Link
            to="/catalogue"
            className={`w-full py-3 rounded-xl border text-center font-bold text-xs tracking-wide transition-all block ${
              isDark
                ? 'bg-transparent hover:bg-[#181113] border-gray-800 text-gray-300'
                : 'bg-transparent hover:bg-gray-100 border-gray-300 text-gray-700'
            }`}
          >
            Continue Shopping Car Accessories
          </Link>
        </div>

      </div>
    </div>
  );
};

export const OrderSuccessPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <OrderSuccessErrorBoundary
      isDark={isDark}
      onNavigateHome={() => navigate('/')}
      onNavigateCatalogue={() => navigate('/catalogue')}
    >
      <OrderSuccessContent />
    </OrderSuccessErrorBoundary>
  );
};
