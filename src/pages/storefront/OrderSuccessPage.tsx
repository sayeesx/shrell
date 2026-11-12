import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Order } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';
import { useTheme } from '../../application/ThemeContext';
import { SEOHead } from '../../infrastructure/seo/SEOHead';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const order = (location.state as { order?: Order })?.order;

  // Fallback demo order ID if accessed directly
  const orderId = order?.id || 'SH-ORD-23984XQ7';
  const customerName = order?.customerName || 'Valued Customer';
  const totalAmount = order ? formatINR(order.totalPaisa) : '₹4,999.00';

  // Trigger celebratory confetti animation strictly inside the payment success card
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = confettiCanvasRef.current;
    if (prefersReducedMotion || !canvas) return;

    const cardConfetti = confetti.create(canvas, { resize: true, useWorker: false });
    const confettiColors = isDark
      ? ['#FF000E', '#E0000C', '#FF000E', '#D4D0D0', '#E5E5E5']
      : ['#FF000E', '#CC000B', '#E0000C', '#140E10', '#000000'];

    // Center burst inside card
    cardConfetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.5, y: 0.42 },
      colors: confettiColors,
      disableForReducedMotion: true,
    });

    // Secondary side bursts inside card
    const timer = setTimeout(() => {
      cardConfetti({
        particleCount: 45,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.55 },
        colors: confettiColors,
        disableForReducedMotion: true,
      });
      cardConfetti({
        particleCount: 45,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.55 },
        colors: confettiColors,
        disableForReducedMotion: true,
      });
    }, 250);

    return () => {
      clearTimeout(timer);
      cardConfetti.reset();
    };
  }, [isDark]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <SEOHead
        title="Order Confirmed | SHRELL Automotive"
        description="Your order has been confirmed successfully."
        noIndex={true}
      />
      <div className="max-w-md mx-auto px-4 py-4 sm:py-8 space-y-6">

        {/* Topbar (Matching Reference Screen 3: Back | Checkout | Bag) */}
        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="Back to Home"
          >
            <i className="bi bi-chevron-left text-sm" />
          </button>

          <h1 className="text-lg font-bold tracking-tight">Checkout</h1>

          <Link
            to="/cart"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="View Cart"
          >
            <i className="bi bi-bag text-sm" />
          </Link>
        </div>

        {/* Main Success Card (Reduced border radius) */}
        <div className={`p-6 sm:p-8 rounded-xl border text-center space-y-6 shadow-sm relative overflow-hidden ${
          isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
        }`}>
          {/* Card-Scoped Confetti Canvas */}
          <canvas
            ref={confettiCanvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full z-20"
            aria-hidden="true"
          />

          {/* Resting Confetti Particles inside card (Theme-matched rectangular/diamond confetti pieces) */}
          <div className="absolute inset-x-0 top-0 h-36 pointer-events-none overflow-hidden opacity-85" aria-hidden="true">
            <span className={`absolute top-5 left-[12%] w-3 h-1.5 rounded-[1px] rotate-[28deg] ${isDark ? 'bg-[#D4D0D0]' : 'bg-[#140E10]'}`} />
            <span className="absolute top-10 left-[22%] w-2.5 h-1 rounded-[1px] -rotate-[40deg] bg-[#FF000E]" />
            <span className={`absolute top-16 left-[9%] w-2 h-2 rotate-45 ${isDark ? 'bg-[#E5E5E5]' : 'bg-[#000000]'}`} />
            <span className="absolute top-6 left-[34%] w-1.5 h-3 rounded-[1px] rotate-[18deg] bg-[#CC000B]" />
            <span className={`absolute top-20 left-[28%] w-3 h-1 rounded-[1px] -rotate-[15deg] ${isDark ? 'bg-[#D4D0D0]' : 'bg-[#140E10]'}`} />
            <span className="absolute top-4 right-[32%] w-2.5 h-1 rounded-[1px] rotate-[52deg] bg-[#FF000E]" />
            <span className={`absolute top-9 right-[20%] w-2 h-2 rotate-45 ${isDark ? 'bg-[#E5E5E5]' : 'bg-[#000000]'}`} />
            <span className="absolute top-14 right-[10%] w-3 h-1.5 rounded-[1px] -rotate-[32deg] bg-[#FF000E]" />
            <span className={`absolute top-22 right-[24%] w-2.5 h-1 rounded-[1px] rotate-[22deg] ${isDark ? 'bg-[#D4D0D0]' : 'bg-[#140E10]'}`} />
            <span className="absolute top-24 left-[15%] w-2 h-1 rounded-[1px] rotate-[65deg] bg-[#E0000C]" />
          </div>

          {/* Solid Vibrant Brand Red Checkmark Badge (Exact match to Reference Screen 3) */}
          <div className="relative pt-4 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-[#FF000E] border-2 border-white/20 flex items-center justify-center shadow-xl shadow-[#FF000E]/35 text-white animate-scale-up">
              <i className="bi bi-check-lg text-5xl font-extrabold stroke-[2]" />
            </div>
          </div>

          {/* Titles & Order Reference */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Payment Successfully
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
              Thanks for your order, {customerName}
            </p>
            <div className="pt-1">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-semibold border ${
                isDark ? 'bg-[#181113] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
              }`}>
                Order ID: {orderId}
              </span>
            </div>
          </div>

          {/* Order Snapshot details */}
          {order && (
            <div className={`p-4 rounded-lg border text-left text-xs space-y-2 ${
              isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
            }`}>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Paid</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Mode</span>
                <span className="font-semibold">{order.paymentMethod === 'MANUAL_UPI' ? 'Direct UPI' : order.paymentMethod}</span>
              </div>
              <div className={`flex justify-between pt-1 border-t ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                <span className="text-gray-400">Shipment</span>
                <span className="text-right truncate max-w-[200px]">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons (Reduced border radius to rounded-xl) */}
          <div className="space-y-3 pt-2">
            <Link
              to={`/track?orderId=${encodeURIComponent(orderId)}`}
              className="w-full py-3.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Track Order</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <i className="bi bi-arrow-right text-xs" />
              </span>
            </Link>

            <Link
              to="/"
              className={`w-full py-3.5 rounded-xl border font-bold text-sm tracking-wide transition-all active:scale-98 flex items-center justify-center ${
                isDark
                  ? 'bg-[#181113] hover:bg-[#201518] border-[#261619] text-[#F1EEEE]'
                  : 'bg-[#FFE0E2] hover:bg-[#FFD2D5] border-[#FFB3B7] text-[#9A0008]'
              }`}
            >
              <span>Back to Home</span>
            </Link>

            {order && (
              <a
                href={whatsAppService.getOrderSupportLink(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline pt-2"
              >
                <i className="bi bi-whatsapp" />
                <span>WhatsApp Dispatch Updates</span>
              </a>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

