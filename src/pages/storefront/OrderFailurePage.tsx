import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../application/ThemeContext';

export const OrderFailurePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const errorMessage = (location.state as { error?: string })?.error ||
    'The transaction was declined or interrupted. No funds were debited.';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-md mx-auto px-4 py-4 sm:py-8 space-y-6">

        {/* Topbar */}
        <div className="flex items-center justify-between pb-3 border-b border-inherit/20">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="Back to Cart"
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

        {/* Main Failure Card (Reduced border radius) */}
        <div className={`p-6 sm:p-8 rounded-xl border text-center space-y-6 shadow-sm relative overflow-hidden ${
          isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
        }`}>

          {/* Big Circular Warning Badge */}
          <div className="pt-4 flex justify-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-[#FF000E]/40 shadow-lg shadow-[#FF000E]/20 ${
              isDark ? 'bg-[#22070A] text-[#FF000E]' : 'bg-[#FFF0F1] text-[#FF000E]'
            }`}>
              <i className="bi bi-x-lg text-4xl font-bold" />
            </div>
          </div>

          {/* Title & Explanation */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-rose-500">
              Payment Failed
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
              {errorMessage}
            </p>
          </div>

          {/* Help box */}
          <div className={`p-4 rounded-lg border text-left text-xs space-y-1.5 ${
            isDark ? 'bg-[#0E0A0B] border-[#261619] text-gray-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-gray-600'
          }`}>
            <div className="font-semibold text-gray-300">Common solutions:</div>
            <p>• Verify 12-digit UPI UTR number if using manual bank transfer.</p>
            <p>• Ensure card international / online e-commerce limits are enabled.</p>
            <p>• You may also opt for Cash on Delivery (COD).</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Retry Payment</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <i className="bi bi-arrow-clockwise text-xs" />
              </span>
            </button>

            <Link
              to="/cart"
              className={`w-full py-3.5 rounded-xl border font-bold text-sm tracking-wide transition-all active:scale-98 flex items-center justify-center ${
                isDark
                  ? 'bg-[#181113] hover:bg-[#201518] border-[#261619] text-[#F1EEEE]'
                  : 'bg-[#FFE0E2] hover:bg-[#FFD2D5] border-[#FFB3B7] text-[#9A0008]'
              }`}
            >
              <span>Back to Cart</span>
            </Link>

            <a
              href="https://wa.me/919876543210?text=Hi%20SHRELL%20Support,%20my%20payment%20encountered%20an%20issue."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline pt-2"
            >
              <i className="bi bi-whatsapp" />
              <span>Contact Support Desk</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

