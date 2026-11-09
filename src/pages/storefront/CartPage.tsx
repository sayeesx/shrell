import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository } from '../../infrastructure/repositories';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, addItem } = useCart();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Load product suggestions
  useEffect(() => {
    async function loadData() {
      try {
        const result = await productRepository.getAll({ limit: 10 });
        setSuggestions(result.products);
      } catch (err) {
        console.error('Failed to load cart suggestions:', err);
      } finally {
        finishPageLoad();
      }
    }
    loadData();
    window.scrollTo(0, 0);
  }, [finishPageLoad]);

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

  // Suggestions excluding items already at maximum quantity
  const displayedSuggestions = suggestions.filter((p) => {
    const inCart = cart.items.find((it) => it.productId === p.id);
    return !inCart || inCart.quantity < p.stockQuantity;
  }).slice(0, 6);

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className={`min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-5 pb-36 ${
        isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
      }`}>
        {/* Mobile Header Bar */}
        <div className="w-full max-w-md flex items-center justify-between pb-3 mb-2 md:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#2D161A] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#D0C9BE] text-[#140E10]'
            }`}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left text-sm" />
          </button>
          <h1 className="text-base font-bold tracking-tight">My Cart</h1>
          <ThemeToggle compact />
        </div>

        <div className={`w-20 h-20 rounded-xl border flex items-center justify-center mx-auto shadow-inner ${
          isDark ? 'bg-[#130E10] border-[#2D161A] text-[#8E8587]' : 'bg-[#F5F3EE] border-[#D0C9BE] text-[#8E8587]'
        }`}>
          <i className="bi bi-bag-x text-3xl" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl font-bold tracking-tight">Your Cart is Empty</h2>
          <p className={`text-xs ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
            Explore precision-fit automotive equipment and accessories engineered for Indian terrain.
          </p>
        </div>
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          <span>Explore Equipment Catalogue</span>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <i className="bi bi-arrow-right text-[10px]" aria-hidden="true" />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
    }`}>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT                                                             */}
      {/* ========================================================================= */}
      <div className="block md:hidden max-w-md mx-auto px-3.5 py-3 pb-56 space-y-2">

        {/* 1. Mobile Header (Back button | My Cart | Theme toggle) */}
        <div className="flex items-center justify-between pb-2 border-b border-inherit/20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#130E10] border-[#2D161A] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#D0C9BE] text-[#140E10]'
            }`}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left text-sm" />
          </button>

          <h1 className="text-base font-bold tracking-tight">My Cart</h1>

          <div className="flex items-center">
            <ThemeToggle compact />
          </div>
        </div>

        {/* 2. Cart Items List (Tighter padding & gap for enhanced contrast and density) */}
        <div className="space-y-2">
          {cart.items.map((item) => {
            const rawImg = item.product.images?.[0]?.url || '';
            const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
              ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
              : rawImg;
            const hasRealImg = Boolean(cleanImg && !cleanImg.includes('shrell-full_white-text_black-logo.png'));

            return (
              <div
                key={item.productId}
                className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2.5 ${
                  isDark ? 'bg-[#130E10] border-[#2D161A]' : 'bg-white border-[#D0C9BE] shadow-xs'
                }`}
              >
                {/* Product image (clean rounded-lg frame) */}
                <div className={`w-16 h-16 shrink-0 rounded-lg flex items-center justify-center p-1 overflow-hidden border ${
                  isDark ? 'bg-[#181113] border-[#2D161A]' : 'bg-[#F5F3EE] border-[#D0C9BE]'
                }`}>
                  {hasRealImg ? (
                    <img
                      src={cleanImg}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-40">
                      <img
                        src="/logos/shrell-brandicon_no-bg.png"
                        alt="SHRELL"
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="font-bold text-xs leading-snug line-clamp-1 block hover:text-[#FF000E] transition-colors"
                  >
                    {item.product.name}
                  </Link>

                  <p className="text-[10.5px] text-gray-400 dark:text-[#8E8587] truncate mt-0.5">
                    {item.product.categoryName || 'OEM Automotive Equipment'} {item.product.sku ? `| ${item.product.sku}` : ''}
                  </p>

                  <p className="font-extrabold text-xs sm:text-sm text-[#FF000E] mt-0.5">
                    {formatINR(item.unitPricePaisa)}
                  </p>

                  {/* Quantity Stepper & Remove Row */}
                  <div className="flex items-center justify-between pt-1 mt-0.5">
                    {/* Quantity Selector: Crisp reduced-radius pill */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                          isDark
                            ? 'bg-[#181113] border-[#2D161A] text-[#F1EEEE] hover:border-[#FF000E]'
                            : 'bg-[#F5F3EE] border-[#D0C9BE] text-[#140E10] hover:border-[#FF000E]'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-bold text-xs font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold transition-all active:scale-90 cursor-pointer disabled:opacity-30 ${
                          isDark
                            ? 'bg-[#181113] border-[#2D161A] text-[#F1EEEE] hover:border-[#FF000E]'
                            : 'bg-[#F5F3EE] border-[#D0C9BE] text-[#140E10] hover:border-[#FF000E]'
                        }`}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove text button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-[11px] font-medium text-gray-400 hover:text-[#FF000E] hover:underline cursor-pointer active:scale-95 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. "+ Add more items" Link */}
        <div className="py-0.5 flex items-center justify-between">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF000E] hover:underline cursor-pointer"
          >
            <i className="bi bi-plus-lg text-[10px]" />
            <span>Add more items</span>
          </Link>

          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            Clear cart
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. PRODUCT SUGGESTIONS (Flush Left - No Title, No Left Margin Indent)   */}
        {/* ========================================================================= */}
        {displayedSuggestions.length > 0 && (
          <div className="pt-1">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory w-full">
              {displayedSuggestions.map((prod) => {
                const inCartItem = cart.items.find((it) => it.productId === prod.id);
                const currentQty = inCartItem?.quantity || 0;

                return (
                  <div
                    key={prod.id}
                    className={`w-32 shrink-0 snap-start p-2 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#130E10] border-[#2D161A]' : 'bg-white border-[#D0C9BE] shadow-xs'
                    }`}
                  >
                    <div>
                      <div className={`w-full h-20 rounded-lg flex items-center justify-center p-1 overflow-hidden border ${
                        isDark ? 'bg-[#181113] border-[#2D161A]' : 'bg-[#F5F3EE] border-[#D0C9BE]'
                      }`}>
                        <img
                          src={prod.images?.[0]?.url || '/logos/shrell-brandicon_no-bg.png'}
                          alt={prod.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Link
                        to={`/product/${prod.slug}`}
                        className="font-bold text-[11px] line-clamp-1 leading-snug mt-1.5 block hover:text-[#FF000E] transition-colors"
                      >
                        {prod.name}
                      </Link>
                      <p className="font-extrabold text-xs text-[#FF000E] mt-0.5">
                        {formatINR(prod.pricePaisa)}
                      </p>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-inherit/20">
                      {currentQty > 0 ? (
                        <div className="w-full flex items-center justify-between rounded-md bg-[#FF000E] text-white py-0.5 px-2 font-bold text-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, currentQty - 1)}
                            className="hover:scale-110 active:scale-95 transition-transform"
                          >
                            −
                          </button>
                          <span className="font-mono text-xs">{currentQty}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, currentQty + 1)}
                            disabled={currentQty >= prod.stockQuantity}
                            className="hover:scale-110 active:scale-95 transition-transform disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addItem(prod, 1)}
                          disabled={prod.stockQuantity <= 0}
                          className="w-full py-1 rounded-md border border-[#FF000E] text-[#FF000E] hover:bg-[#FF000E] hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Voucher Code Box */}
        <div className={`p-2.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-[#130E10] border-[#2D161A]' : 'bg-white border-[#D0C9BE] shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <i className="bi bi-tag-fill text-[#FF000E]" />
              <span>Coupon Voucher</span>
            </span>
            {cart.appliedCoupon && (
              <button
                type="button"
                onClick={removeCoupon}
                className="text-[#FF000E] hover:underline text-[11px] cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {cart.appliedCoupon ? (
            <div className={`p-2 rounded-lg flex items-center justify-between text-xs font-mono font-bold ${
              isDark ? 'bg-[#181113] text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                placeholder=""
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#FF000E] border ${
                  isDark ? 'bg-[#181113] border-[#2D161A] text-white' : 'bg-[#F5F3EE] border-[#D0C9BE] text-black'
                }`}
              />
              <button
                type="submit"
                disabled={isApplying || !couponCode.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
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

        {/* 6. Summary Breakdown */}
        <div className={`p-2.5 rounded-xl border space-y-2 text-xs ${
          isDark ? 'bg-[#130E10] border-[#2D161A]' : 'bg-white border-[#D0C9BE] shadow-xs'
        }`}>
          <div className="flex justify-between items-center text-gray-400">
            <span>Sub total</span>
            <span className="font-semibold text-inherit">{formatINR(cart.subtotalPaisa)}</span>
          </div>

          <div className="flex justify-between items-center text-gray-400">
            <span>Delivery Fee</span>
            <span className="font-semibold">
              {cart.shippingPaisa === 0 ? (
                <span className="text-emerald-500 font-bold">FREE</span>
              ) : (
                formatINR(cart.shippingPaisa)
              )}
            </span>
          </div>

          {cart.discountPaisa > 0 && (
            <div className="flex justify-between items-center text-emerald-500 font-medium">
              <span>Coupon Discount</span>
              <span>−{formatINR(cart.discountPaisa)}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-inherit/20 flex justify-between items-center">
            <span className="font-bold text-xs sm:text-sm">Total</span>
            <span className="font-extrabold text-sm sm:text-base text-[#FF000E]">
              {formatINR(cart.totalPaisa)}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE FIXED BOTTOM CTA BUTTON (Fixed directly on top of dock nav bar)   */}
      {/* ========================================================================= */}
      <div
        className={`fixed left-0 right-0 z-30 md:hidden p-3 border-t backdrop-blur-xl transition-all ${
          isDark
            ? 'bg-[#0A0808]/95 border-[#2D161A] shadow-[0_-8px_25px_rgba(0,0,0,0.85)]'
            : 'bg-white/95 border-[#D0C9BE] shadow-[0_-4px_18px_rgba(0,0,0,0.1)]'
        }`}
        style={{ bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block leading-tight">Total</span>
            <span className="font-extrabold text-sm text-[#FF000E] font-tight block leading-tight">
              {formatINR(cart.totalPaisa)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="flex-1 py-3 px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Select address at next step</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <i className="bi bi-arrow-right text-[10px]" />
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (2-column layout with reduced radii and matching theme)    */}
      {/* ========================================================================= */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">

        {/* Desktop Header */}
        <div className="flex items-center justify-between border-b pb-4 border-inherit/20">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">My Shopping Cart</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
              {cart.items.length} unique automotive equipment accessory item(s) selected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearCart}
              className={`text-xs font-medium transition-colors cursor-pointer ${
                isDark ? 'text-[#8E8587] hover:text-[#FF000E]' : 'text-[#706869] hover:text-[#FF000E]'
              }`}
            >
              Empty Cart
            </button>
            <Link
              to="/catalogue"
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors ${
                isDark ? 'border-[#261619] hover:bg-[#130E10] text-[#F1EEEE]' : 'bg-white border-[#E0DBD2] hover:bg-[#F8F8F8] text-[#140E10]'
              }`}
            >
              + Add More Items
            </Link>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
          isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
        }`}>
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <i className="bi bi-truck text-[#FF000E] text-base" />
              {remainingForFreeShipping === 0
                ? 'Unlocked: Free Express Surface Shipping across India!'
                : `Add ${formatINR(remainingForFreeShipping)} more for Free Express Shipping`}
            </span>
            <span className="text-[#FF000E] font-bold">
              {remainingForFreeShipping === 0 ? 'FREE' : 'Threshold ₹4,999'}
            </span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#FF000E] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round((cart.subtotalPaisa / freeThreshold) * 100))}%` }}
            />
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* Left Column (8 cols): Items list + Instamart Recommendations */}
          <div className="col-span-7 lg:col-span-8 space-y-3.5">
            {cart.items.map((item) => {
              const rawImg = item.product.images?.[0]?.url || '';
              const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
                ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
                : rawImg;
              const hasRealImg = Boolean(cleanImg && !cleanImg.includes('shrell-full_white-text_black-logo.png'));

              return (
                <div
                  key={item.productId}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                    isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
                  }`}
                >
                  {/* Product Image Frame */}
                  <div className={`w-20 h-20 shrink-0 rounded-lg flex items-center justify-center p-2 overflow-hidden border ${
                    isDark ? 'bg-[#181113] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                  }`}>
                    {hasRealImg ? (
                      <img
                        src={cleanImg}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-40">
                        <img
                          src="/logos/shrell-brandicon_no-bg.png"
                          alt="SHRELL"
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="font-bold text-sm leading-snug line-clamp-1 hover:text-[#FF000E] transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.product.categoryName || 'OEM Automotive Equipment'} {item.product.sku ? `• SKU: ${item.product.sku}` : ''}
                        </p>
                      </div>

                      <span className="font-extrabold text-base text-[#FF000E] shrink-0">
                        {formatINR(item.unitPricePaisa)}
                      </span>
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between pt-2 border-t border-inherit/20">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                            isDark
                              ? 'bg-[#181113] border-[#261619] text-[#F1EEEE] hover:border-[#FF000E]'
                              : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10] hover:border-[#FF000E]'
                          }`}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-xs font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs font-bold transition-all active:scale-90 cursor-pointer disabled:opacity-30 ${
                            isDark
                              ? 'bg-[#181113] border-[#261619] text-[#F1EEEE] hover:border-[#FF000E]'
                              : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10] hover:border-[#FF000E]'
                          }`}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-xs font-medium text-gray-400 hover:text-[#FF000E] hover:underline cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Suggestions Grid (Desktop) */}
            {displayedSuggestions.length > 0 && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
              }`}>
                <div className="grid grid-cols-3 gap-3">
                  {displayedSuggestions.slice(0, 3).map((prod) => {
                    const inCartItem = cart.items.find((it) => it.productId === prod.id);
                    const currentQty = inCartItem?.quantity || 0;

                    return (
                      <div
                        key={prod.id}
                        className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                          isDark ? 'bg-[#181113] border-[#261619]' : 'bg-[#FAF8F5] border-[#E0DBD2]'
                        }`}
                      >
                        <div>
                          <div className={`w-full h-24 rounded-md flex items-center justify-center p-1.5 overflow-hidden border ${
                            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2]'
                          }`}>
                            <img
                              src={prod.images?.[0]?.url || '/logos/shrell-brandicon_no-bg.png'}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <Link
                            to={`/product/${prod.slug}`}
                            className="font-bold text-xs line-clamp-1 leading-snug mt-1.5 block hover:text-[#FF000E] transition-colors"
                          >
                            {prod.name}
                          </Link>
                          <p className="font-extrabold text-xs text-[#FF000E] mt-0.5">
                            {formatINR(prod.pricePaisa)}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-inherit/20">
                          {currentQty > 0 ? (
                            <div className="w-full flex items-center justify-between rounded-md bg-[#FF000E] text-white py-1 px-2 font-bold text-xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(prod.id, currentQty - 1)}
                                className="hover:scale-110 active:scale-95 transition-transform"
                              >
                                −
                              </button>
                              <span className="font-mono text-xs">{currentQty}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(prod.id, currentQty + 1)}
                                disabled={currentQty >= prod.stockQuantity}
                                className="hover:scale-110 active:scale-95 transition-transform disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addItem(prod, 1)}
                              disabled={prod.stockQuantity <= 0}
                              className="w-full py-1.5 rounded-md border border-[#FF000E] text-[#FF000E] hover:bg-[#FF000E] hover:text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                            >
                              + ADD
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (4 cols, sticky): Order Summary Card */}
          <div className="col-span-5 lg:col-span-4 space-y-3.5 sticky top-24">
            {/* Voucher Coupon Section */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${
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
                    className="text-[#FF000E] hover:underline text-[11px] cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {cart.appliedCoupon ? (
                <div className={`p-2 rounded-lg flex items-center justify-between text-xs font-mono font-bold ${
                  isDark ? 'bg-[#181113] text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                    placeholder=""
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#FF000E] border ${
                      isDark ? 'bg-[#181113] border-[#261619] text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-black'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isApplying || !couponCode.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
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
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
            }`}>
              <h2 className="font-bold text-xs uppercase tracking-wider border-b pb-2 border-inherit/20">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Sub total</span>
                  <span className="font-semibold text-inherit">{formatINR(cart.subtotalPaisa)}</span>
                </div>

                <div className="flex justify-between items-center text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">
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

                <div className="flex justify-between items-center text-[11px] opacity-70">
                  <span>Includes 18% GST</span>
                  <span className="font-mono">{formatINR(cart.taxPaisa)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-inherit/20 flex justify-between items-center">
                <span className="font-bold text-sm">Total</span>
                <span className="font-extrabold text-lg text-[#FF000E]">
                  {formatINR(cart.totalPaisa)}
                </span>
              </div>

              {/* Desktop CTA Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-xs uppercase tracking-wider text-center shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Select address at next step</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <i className="bi bi-arrow-right text-[10px]" />
                  </span>
                </button>
              </div>

              {/* Payment badges */}
              <div className="pt-2 flex items-center justify-center gap-3 text-[10.5px] text-gray-400 border-t border-inherit/20">
                <span className="flex items-center gap-1">
                  <i className="bi bi-shield-lock-fill text-emerald-500" /> Secure Checkout
                </span>
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
