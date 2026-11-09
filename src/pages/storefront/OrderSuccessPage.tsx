import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Order } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';
import { useTheme } from '../../application/ThemeContext';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const order = (location.state as { order?: Order })?.order;

  // Fallback demo order ID if accessed directly
  const orderId = order?.id || 'SH-ORD-23984XQ7';
  const customerName = order?.customerName || 'Valued Customer';
  const totalAmount = order ? formatINR(order.totalPaisa) : '₹4,999.00';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-md mx-auto px-4 py-4 sm:py-8 space-y-6">

        {/* Topbar (Matching Reference Screen 3: Back | Checkout | Bag) */}
        <div className="flex items-center justify-between pb-3 border-b border-inherit/20">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="Back to Home"
          >
            <i className="bi bi-arrow-left text-sm" />
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

        {/* Main Success Card (Exact Design & Alignment from Reference) */}
        <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-6 shadow-sm relative overflow-hidden ${
          isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
        }`}>

          {/* Decorative Confetti & Accent Dots (Reference Alignment) */}
          <div className="absolute inset-x-0 top-6 flex justify-around pointer-events-none opacity-80" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 -translate-y-2 translate-x-4" />
            <span className="w-3 h-1.5 rounded-full bg-purple-500 rotate-45 translate-y-3" />
            <span className="w-2 h-2 rounded-full bg-pink-500 translate-y-8 -translate-x-6" />
            <span className="w-3 h-1 rounded-full bg-amber-400 -rotate-12 translate-y-1" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 translate-y-6 translate-x-8" />
          </div>

          {/* Big Circular Red Badge with White Checkmark (Exact Reference) */}
          <div className="relative pt-4 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-[#FF000E] flex items-center justify-center shadow-lg shadow-[#FF000E]/20 text-white animate-scale-up">
              <i className="bi bi-check2 text-5xl font-extrabold stroke-[2]" />
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
              <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold border ${
                isDark ? 'bg-[#181113] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
              }`}>
                Order ID: {orderId}
              </span>
            </div>
          </div>

          {/* Order Snapshot details */}
          {order && (
            <div className={`p-4 rounded-2xl border text-left text-xs space-y-2 ${
              isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
            }`}>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Paid</span>
                <span className="font-bold text-[#FF000E]">{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Mode</span>
                <span className="font-semibold">{order.paymentMethod === 'MANUAL_UPI' ? 'Direct UPI' : order.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-inherit/20">
                <span className="text-gray-400">Shipment</span>
                <span className="text-right truncate max-w-[200px]">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons (Exact Reference: Track Order [Red] + Back to Home [Soft]) */}
          <div className="space-y-3 pt-2">
            <Link
              to={`/track?orderId=${encodeURIComponent(orderId)}`}
              className="w-full py-3.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Track Order</span>
              <i className="bi bi-arrow-right text-sm" />
            </Link>

            <Link
              to="/"
              className={`w-full py-3.5 rounded-full border font-bold text-sm tracking-wide transition-all active:scale-98 flex items-center justify-center ${
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

