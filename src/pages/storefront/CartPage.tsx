import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { formatINR } from '../../domain/services/CurrencyService';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  React.useEffect(() => {
    finishPageLoad();
    window.scrollTo(0, 0);
  }, [finishPageLoad]);

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    setCouponMessage(null);
    const result = await applyCoupon(couponCode);
    setIsApplying(false);

    setCouponMessage({
      text: result.message,
      isError: !result.success,
    });
    if (result.success) {
      setCouponCode('');
    }
  };

  // Free shipping threshold (₹4,999 = 499900 Paisa)
  const freeThreshold = 499900;
  const remainingForFreeShipping = Math.max(0, freeThreshold - cart.subtotalPaisa);

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6 ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
        {/* Mobile Header Bar */}
        <div className="w-full max-w-md flex items-center justify-between pb-6 mb-4 border-b md:hidden border-inherit/20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left text-sm" />
          </button>
          <h1 className="text-base font-bold tracking-tight">My Cart</h1>
          <ThemeToggle compact />
        </div>

        <div className={`w-24 h-24 rounded-full border flex items-center justify-center mx-auto shadow-inner ${
          isDark ? 'bg-[#130E10] border-[#261619] text-[#8E8587]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#8E8587]'
        }`}>
          <i className="bi bi-bag-x text-4xl" aria-hidden="true" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Your Cart is Empty</h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            Explore our OEM precision fit accessories and equipment engineered for your vehicle.
          </p>
        </div>
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-95"
        >
          <span>Explore Equipment Catalogue</span>
          <i className="bi bi-arrow-right text-xs" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-36 md:pb-12 space-y-6">

        {/* ========================================================= */}
        {/* MOBILE TOPBAR (Matching Reference: Back | My Cart | Moon)  */}
        {/* ========================================================= */}
        <div className="flex md:hidden items-center justify-between pb-3 border-b border-inherit/20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'
            }`}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left text-sm" />
          </button>

          <h1 className="text-lg font-bold tracking-tight">My Cart</h1>

          <div className="flex items-center">
            <ThemeToggle compact />
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP HEADER (Breadcrumb + Title + Item Count)          */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center justify-between border-b pb-4 border-inherit/20">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Shopping Cart</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
              {cart.items.length} unique automotive equipment accessory item(s)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearCart}
              className={`text-xs font-medium transition-colors cursor-pointer ${
                isDark ? 'text-[#8E8587] hover:text-[#FF000E]' : 'text-[#5C5456] hover:text-[#FF000E]'
              }`}
            >
              Empty Cart
            </button>
            <Link
              to="/catalogue"
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                isDark ? 'border-[#261619] hover:bg-[#130E10] text-[#F1EEEE]' : 'border-[#E0DBD2] hover:bg-[#F5F3EE] text-[#140E10]'
              }`}
            >
              + Add More Items
            </Link>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-2 ${
          isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
        }`}>
          <div className="flex items-center justify-between font-medium">
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
              <i className="bi bi-truck text-[#FF000E] text-sm" />
              {remainingForFreeShipping === 0
                ? 'Unlocked: Free Express Surface Shipping across India!'
                : `Add ${formatINR(remainingForFreeShipping)} more for Free Express Shipping`}
            </span>
            <span className="text-[#FF000E] font-bold">
              {remainingForFreeShipping === 0 ? 'FREE' : 'Threshold ₹4,999'}
            </span>
          </div>
          <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#FF000E] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round((cart.subtotalPaisa / freeThreshold) * 100))}%` }}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: Responsive Split Layout                       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT: CART ITEMS LIST (Reference Design Alignment) */}
          <div className="md:col-span-7 lg:col-span-8 space-y-3.5">
            {cart.items.map((item) => {
              const rawImg = item.product.images?.[0]?.url || '';
              const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
                ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
                : rawImg;
              const hasRealImg = Boolean(cleanImg && !cleanImg.includes('shrell-full_white-text_black-logo.png'));

              return (
                <div
                  key={item.productId}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 sm:gap-4 ${
                    isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
                  }`}
                >
                  {/* Left: Circular / Rounded Thumbnail (Reference Exact Alignment) */}
                  <div className={`w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-full sm:rounded-2xl flex items-center justify-center p-2 overflow-hidden border ${
                    isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                  }`}>
                    {hasRealImg ? (
                      <img
                        src={cleanImg}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <img
                          src="/logos/shrell-brandicon_no-bg.png"
                          alt="SHRELL"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="font-bold text-sm sm:text-base leading-snug line-clamp-1 hover:text-[#FF000E] transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
                          {item.product.categoryName || 'OEM Automotive Equipment'} {item.product.sku ? `• ${item.product.sku}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Price and Quantity Pill Row */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-sm sm:text-base font-tight tracking-tight text-[#FF000E]">
                        {formatINR(item.unitPricePaisa)}
                      </span>

                      <div className="flex items-center gap-3">
                        {/* Quantity Pill (- 1 +) */}
                        <div className={`flex items-center rounded-full px-2 py-0.5 border ${
                          isDark ? 'bg-[#181113] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                        }`}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors cursor-pointer active:scale-90 ${
                              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                            }`}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-bold text-xs sm:text-sm font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors cursor-pointer active:scale-90 disabled:opacity-30 ${
                              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                            }`}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Text Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-xs font-semibold text-[#FF2E3A] hover:text-[#FF000E] transition-colors cursor-pointer px-1 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* "+ Add more items" Button (Reference alignment) */}
            <div className="pt-2 text-center md:text-left">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF000E] hover:text-[#E0000C] transition-colors cursor-pointer py-1"
              >
                <i className="bi bi-plus-lg text-xs" />
                <span>Add more items</span>
              </Link>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY & CHECKOUT CTA */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            {/* Voucher Coupon Section */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <i className="bi bi-tag-fill text-[#FF000E]" />
                  <span>Promotion Voucher</span>
                </span>
                {cart.appliedCoupon && (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[#FF2E3A] hover:underline text-[11px] cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {cart.appliedCoupon ? (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-[#181113] border-emerald-900/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span className="font-mono font-bold">{cart.appliedCoupon.code}</span>
                  <span>−{formatINR(cart.discountPaisa)}</span>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VAHN10"
                    className={`flex-1 rounded-full px-3.5 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#FF000E] border ${
                      isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isApplying || !couponCode.trim()}
                    className="px-4 py-2 rounded-full bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMessage && (
                <p className={`text-xs ${couponMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            {/* Price Breakdown Card (Matching Reference Layout) */}
            <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
              isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
            }`}>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-[#8E8587]' : 'text-[#706869]'}>Sub total</span>
                  <span className="font-semibold font-tight">{formatINR(cart.subtotalPaisa)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-[#8E8587]' : 'text-[#706869]'}>Delivery Fee</span>
                  <span className="font-semibold font-tight">
                    {cart.shippingPaisa === 0 ? (
                      <span className="text-emerald-400 font-bold">FREE</span>
                    ) : (
                      formatINR(cart.shippingPaisa)
                    )}
                  </span>
                </div>

                {cart.discountPaisa > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>Discount</span>
                    <span className="font-semibold font-tight">−{formatINR(cart.discountPaisa)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs opacity-70">
                  <span className={isDark ? 'text-[#8E8587]' : 'text-[#706869]'}>Includes 18% GST</span>
                  <span className="font-mono">{formatINR(cart.taxPaisa)}</span>
                </div>
              </div>

              <div className={`pt-3 border-t flex justify-between items-center ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                <span className="font-bold text-base sm:text-lg">Total</span>
                <span className="font-extrabold text-lg sm:text-xl font-tight text-[#FF000E]">
                  {formatINR(cart.totalPaisa)}
                </span>
              </div>

              {/* Desktop Checkout CTA */}
              <div className="hidden md:block pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Select address at next step</span>
                  <i className="bi bi-arrow-right text-sm" />
                </button>
              </div>
            </div>

            {/* Empty Cart on mobile */}
            <div className="md:hidden text-center pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-gray-500 hover:text-rose-500 transition-colors"
              >
                Clear all items from cart
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE STICKY BOTTOM BAR (Matching Reference Exact CTA)   */}
        {/* ========================================================= */}
        <div className={`fixed bottom-0 left-0 right-0 z-30 md:hidden p-4 border-t backdrop-blur-xl transition-all ${
          isDark ? 'bg-[#0A0808]/95 border-[#261619] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]' : 'bg-white/95 border-[#E0DBD2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
        }`}>
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total ({cart.items.length} items)</span>
              <span className="font-extrabold text-base text-[#FF000E] font-tight">{formatINR(cart.totalPaisa)}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Select address at next step</span>
              <i className="bi bi-arrow-right text-sm" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
