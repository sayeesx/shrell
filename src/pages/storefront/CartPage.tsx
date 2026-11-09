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
      <div className={`min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6 ${
        isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#F4F3EE] text-[#140E10]'
      }`}>
        {/* Mobile Header Bar */}
        <div className="w-full max-w-md flex items-center justify-between pb-4 mb-2 md:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#221215] text-[#FF666E]' : 'bg-[#FDECEE] text-[#B02A37]'
            }`}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left text-sm" />
          </button>
          <h1 className="text-base font-bold tracking-tight">My Cart</h1>
          <ThemeToggle compact />
        </div>

        <div className={`w-24 h-24 rounded-full border flex items-center justify-center mx-auto shadow-inner ${
          isDark ? 'bg-[#130E10] border-[#261619] text-[#8E8587]' : 'bg-white border-[#E0DBD2] text-[#8E8587]'
        }`}>
          <i className="bi bi-bag-x text-4xl" aria-hidden="true" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Your Cart is Empty</h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
            Explore our precision fit automotive accessories and equipment engineered for Indian terrain.
          </p>
        </div>
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D12B2F] hover:bg-[#B82226] text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-95"
        >
          <span>Explore Equipment Catalogue</span>
          <i className="bi bi-arrow-right text-xs" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#F4F3EE] text-[#140E10]'
    }`}>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (Brutally Executed from the exact reference image)          */}
      {/* ========================================================================= */}
      <div className="block md:hidden max-w-md mx-auto px-4 py-4 pb-36 space-y-4">

        {/* 1. Mobile Header (Back pill | My Cart | Moon toggle) */}
        <div className="flex items-center justify-between pb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#221215] text-[#FF666E]' : 'bg-[#FDECEE] text-[#B02A37]'
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

        {/* 2. Cart Items List (Exact cards matching the reference image) */}
        <div className="space-y-3">
          {cart.items.map((item) => {
            const rawImg = item.product.images?.[0]?.url || '';
            const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
              ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
              : rawImg;
            const hasRealImg = Boolean(cleanImg && !cleanImg.includes('shrell-full_white-text_black-logo.png'));

            return (
              <div
                key={item.productId}
                className={`p-3.5 rounded-3xl transition-all duration-200 flex items-center gap-3.5 ${
                  isDark ? 'bg-[#130E10] border border-[#261619]' : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }`}
              >
                {/* Left: Circular product image (Exact reference circle) */}
                <div className={`w-18 h-18 shrink-0 rounded-full flex items-center justify-center p-2 overflow-hidden border ${
                  isDark ? 'bg-[#1A1214] border-white/5' : 'bg-[#F8F8F8] border-black/5'
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
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="font-bold text-sm leading-snug line-clamp-1 block text-gray-900 dark:text-gray-100"
                  >
                    {item.product.name}
                  </Link>

                  <p className="text-[11px] text-gray-400 dark:text-gray-400 truncate mt-0.5">
                    {item.product.categoryName || 'OEM Automotive Equipment'} {item.product.sku ? `| ${item.product.sku}` : ''}
                  </p>

                  <p className="font-extrabold text-sm text-gray-900 dark:text-white mt-1">
                    {formatINR(item.unitPricePaisa)}
                  </p>

                  {/* Bottom Action Row: (- 1 +) on left, Remove on right */}
                  <div className="flex items-center justify-between pt-1.5 mt-0.5">
                    {/* Quantity Selector: soft round buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform active:scale-90 cursor-pointer ${
                          isDark ? 'bg-[#2A1417] text-[#FF666E]' : 'bg-[#FCE8EA] text-[#D93844]'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-bold text-xs font-mono text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform active:scale-90 cursor-pointer disabled:opacity-30 ${
                          isDark ? 'bg-[#2A1417] text-[#FF666E]' : 'bg-[#FCE8EA] text-[#D93844]'
                        }`}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove text button in subtle peach/coral */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-xs font-medium text-[#E77077] dark:text-[#FF8088] hover:underline cursor-pointer active:scale-95"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. "+ Add more items" (Exact reference placement and color) */}
        <div className="pt-1">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E56A55] dark:text-[#FF6A55] hover:underline cursor-pointer py-1"
          >
            <span>+ Add more items</span>
          </Link>
        </div>

        {/* 4. Voucher Code Box */}
        <div className={`p-3.5 rounded-2xl border space-y-2 ${
          isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-black/5 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <i className="bi bi-tag-fill text-[#D12B2F]" />
              <span>Coupon Voucher</span>
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
            <div className={`p-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold ${
              isDark ? 'bg-[#181113] text-emerald-400' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <span>{cart.appliedCoupon.code}</span>
              <span>−{formatINR(cart.discountPaisa)}</span>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE (e.g. VAHN10)"
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#D12B2F] border ${
                  isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F7F7F7] border-gray-200 text-black'
                }`}
              />
              <button
                type="submit"
                disabled={isApplying || !couponCode.trim()}
                className="px-4 py-1.5 rounded-full bg-[#D12B2F] hover:bg-[#B82226] disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
              >
                Apply
              </button>
            </form>
          )}

          {couponMessage && (
            <p className={`text-[11px] ${couponMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
              {couponMessage.text}
            </p>
          )}
        </div>

        {/* 5. Summary Section (Exact reference styling: Sub total, Delivery Fee, Total) */}
        <div className="pt-2 space-y-2 text-sm">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-xs">
            <span>Sub total</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatINR(cart.subtotalPaisa)}</span>
          </div>

          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-xs">
            <span>Delivery Fee</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {cart.shippingPaisa === 0 ? (
                <span className="text-emerald-500 font-bold">FREE</span>
              ) : (
                formatINR(cart.shippingPaisa)
              )}
            </span>
          </div>

          {cart.discountPaisa > 0 && (
            <div className="flex justify-between items-center text-xs text-emerald-500 font-medium">
              <span>Coupon Discount</span>
              <span>−{formatINR(cart.discountPaisa)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 dark:border-[#261619] flex justify-between items-center">
            <span className="font-bold text-sm text-gray-900 dark:text-white">Total</span>
            <span className="font-extrabold text-base text-gray-900 dark:text-white">
              {formatINR(cart.totalPaisa)}
            </span>
          </div>
        </div>

        {/* 6. Primary Action Button: "Select address at next step" (Exact Reference Button) */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 rounded-full bg-[#D12B2F] hover:bg-[#B82226] text-white font-bold text-sm tracking-wide text-center shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Select address at next step</span>
          </button>
        </div>

        {/* Clear cart option */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] text-gray-400 hover:text-rose-500 transition-colors"
          >
            Clear all items
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (Bespoke 2-column layout designed specifically for web)   */}
      {/* ========================================================================= */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* Desktop Header */}
        <div className="flex items-center justify-between border-b pb-4 border-inherit/20">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Shopping Cart</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
              {cart.items.length} unique automotive equipment accessory item(s) selected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearCart}
              className={`text-xs font-medium transition-colors cursor-pointer ${
                isDark ? 'text-[#8E8587] hover:text-[#FF000E]' : 'text-[#706869] hover:text-[#D12B2F]'
              }`}
            >
              Empty Cart
            </button>
            <Link
              to="/catalogue"
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                isDark ? 'border-[#261619] hover:bg-[#130E10] text-[#F1EEEE]' : 'bg-white border-[#E0DBD2] hover:bg-[#F8F8F8] text-[#140E10]'
              }`}
            >
              + Add More Items
            </Link>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className={`p-4 rounded-3xl border text-xs space-y-2 ${
          isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-black/5 shadow-xs'
        }`}>
          <div className="flex items-center justify-between font-medium">
            <span className={`flex items-center gap-2 ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
              <i className="bi bi-truck text-[#D12B2F] text-base" />
              {remainingForFreeShipping === 0
                ? 'Unlocked: Free Express Surface Shipping across India!'
                : `Add ${formatINR(remainingForFreeShipping)} more for Free Express Shipping`}
            </span>
            <span className="text-[#D12B2F] font-bold">
              {remainingForFreeShipping === 0 ? 'FREE' : 'Threshold ₹4,999'}
            </span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#D12B2F] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round((cart.subtotalPaisa / freeThreshold) * 100))}%` }}
            />
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left Column (8 cols): Items list styled with the exact circular thumbnails and soft pill controls */}
          <div className="col-span-7 lg:col-span-8 space-y-4">
            {cart.items.map((item) => {
              const rawImg = item.product.images?.[0]?.url || '';
              const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
                ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
                : rawImg;
              const hasRealImg = Boolean(cleanImg && !cleanImg.includes('shrell-full_white-text_black-logo.png'));

              return (
                <div
                  key={item.productId}
                  className={`p-5 rounded-3xl border transition-all duration-200 flex items-center gap-5 ${
                    isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-black/5 shadow-sm'
                  }`}
                >
                  {/* Circular Product Image Thumbnail */}
                  <div className={`w-24 h-24 shrink-0 rounded-full flex items-center justify-center p-3 overflow-hidden border ${
                    isDark ? 'bg-[#1A1214] border-white/5' : 'bg-[#F8F8F8] border-black/5'
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
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="font-bold text-base leading-snug line-clamp-1 hover:text-[#D12B2F] transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.product.categoryName || 'OEM Automotive Equipment'} {item.product.sku ? `• SKU: ${item.product.sku}` : ''}
                        </p>
                      </div>

                      <span className="font-extrabold text-lg text-gray-900 dark:text-white shrink-0">
                        {formatINR(item.unitPricePaisa)}
                      </span>
                    </div>

                    {/* Bottom Action Row: (- 1 +) and Remove */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform active:scale-90 cursor-pointer ${
                            isDark ? 'bg-[#2A1417] text-[#FF666E]' : 'bg-[#FCE8EA] text-[#D93844]'
                          }`}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-sm font-mono text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform active:scale-90 cursor-pointer disabled:opacity-30 ${
                            isDark ? 'bg-[#2A1417] text-[#FF666E]' : 'bg-[#FCE8EA] text-[#D93844]'
                          }`}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-xs font-medium text-[#E77077] dark:text-[#FF8088] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* "+ Add more items" Link */}
            <div className="pt-2">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#E56A55] dark:text-[#FF6A55] hover:underline cursor-pointer py-1"
              >
                <i className="bi bi-plus-lg text-xs" />
                <span>Add more items</span>
              </Link>
            </div>
          </div>

          {/* Right Column (4 cols, sticky): Order Summary */}
          <div className="col-span-5 lg:col-span-4 space-y-5 sticky top-24">
            {/* Voucher Coupon Section */}
            <div className={`p-5 rounded-3xl border space-y-3 ${
              isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-black/5 shadow-sm'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <i className="bi bi-tag-fill text-[#D12B2F]" />
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
                <div className={`p-2.5 rounded-2xl flex items-center justify-between text-xs font-mono font-bold ${
                  isDark ? 'bg-[#181113] text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <span>{cart.appliedCoupon.code}</span>
                  <span>−{formatINR(cart.discountPaisa)}</span>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VAHN10"
                    className={`flex-1 rounded-full px-3.5 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#D12B2F] border ${
                      isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F8F8F8] border-gray-200 text-black'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isApplying || !couponCode.trim()}
                    className="px-5 py-2 rounded-full bg-[#D12B2F] hover:bg-[#B82226] disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
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

            {/* Price Breakdown Card */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-black/5 shadow-sm'
            }`}>
              <h2 className="font-bold text-base border-b pb-3 border-inherit/20">Order Summary</h2>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                  <span>Sub total</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatINR(cart.subtotalPaisa)}</span>
                </div>

                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cart.shippingPaisa === 0 ? (
                      <span className="text-emerald-500 font-bold">FREE</span>
                    ) : (
                      formatINR(cart.shippingPaisa)
                    )}
                  </span>
                </div>

                {cart.discountPaisa > 0 && (
                  <div className="flex justify-between items-center text-emerald-500 font-medium">
                    <span>Discount Voucher</span>
                    <span>−{formatINR(cart.discountPaisa)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs opacity-70">
                  <span>Includes 18% GST</span>
                  <span className="font-mono">{formatINR(cart.taxPaisa)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-[#261619] flex justify-between items-center">
                <span className="font-bold text-base">Total</span>
                <span className="font-extrabold text-xl text-gray-900 dark:text-white">
                  {formatINR(cart.totalPaisa)}
                </span>
              </div>

              {/* Desktop CTA Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 rounded-full bg-[#D12B2F] hover:bg-[#B82226] text-white font-bold text-sm tracking-wide text-center shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Select address at next step</span>
                </button>
              </div>

              {/* Payment badges */}
              <div className="pt-2 flex items-center justify-center gap-3 text-xs text-gray-400 border-t border-gray-100 dark:border-white/5 pt-3">
                <span className="flex items-center gap-1"><i className="bi bi-shield-lock-fill text-emerald-500" /> Secure Checkout</span>
                <span>•</span>
                <span>UPI / Cards / COD</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
