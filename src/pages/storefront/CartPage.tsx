import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { formatINR } from '../../domain/services/CurrencyService';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';
import { ProductImagePlaceholder } from '../../components/common/ProductImagePlaceholder';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';
import { ShrellLoader } from '../../components/common/ShrellLoader';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, openCheckout } = useCart();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();

  React.useEffect(() => {
    finishPageLoad();
  }, [finishPageLoad]);

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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

  if (cart.items.length === 0) {
    return (
      <div className={`max-w-4xl mx-auto px-4 py-20 text-center space-y-6 ${isDark ? '' : ''}`}>
        <div className={`w-20 h-20 rounded-full border flex items-center justify-center mx-auto ${isDark ? 'bg-[#130E10] border-[#261619] text-[#8E8587]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#8E8587]'}`}>
          <i className="bi bi-bag-x text-3xl" aria-hidden="true"></i>
        </div>
        <div className="space-y-2">
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>Your Shopping Cart is Empty</h1>
          <p className={`text-sm ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            You haven't added any automotive equipment or accessories yet.
          </p>
        </div>
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-xs uppercase tracking-wider transition-colors"
        >
          <span>Explore Equipment Catalogue</span>
          <i className="bi bi-arrow-right text-xs" aria-hidden="true"></i>
        </Link>
      </div>
    );
  }

  // Free shipping threshold progress calculation (₹4,999.00 = 499900 Paisa)
  const freeThreshold = 499900;
  const remainingForFreeShipping = Math.max(0, freeThreshold - cart.subtotalPaisa);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>Shopping Cart</h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            {cart.items.length} unique accessory item(s) selected
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className={`text-xs font-medium transition-colors cursor-pointer ${isDark ? 'text-[#8E8587] hover:text-[#FF000E]' : 'text-[#5C5456] hover:text-[#FF000E]'}`}
        >
          Empty Cart
        </button>
      </div>

      {/* Free Shipping Alert Bar */}
      <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
        <div className="flex items-center justify-between text-xs font-medium">
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
            <i className="bi bi-truck text-[#FF000E] text-sm"></i>
            {remainingForFreeShipping === 0
              ? 'Congratulations: You have unlocked Free Express Surface Shipping!'
              : `Add ${formatINR(remainingForFreeShipping)} more to qualify for Free Express Shipping.`}
          </span>
          <span className="text-[#FF000E] font-medium">
            {remainingForFreeShipping === 0 ? 'FREE' : 'Threshold: ₹4,999'}
          </span>
        </div>
        <div className={`w-full rounded-full h-2 overflow-hidden border ${isDark ? 'bg-[#0A0808] border-[#261619]' : 'bg-[#EDE9E1] border-[#E0DBD2]'}`}>
          <div
            className="bg-[#FF000E] h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, (cart.subtotalPaisa / freeThreshold) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-[#E0DBD2]'}`}
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-20 h-16 rounded-md overflow-hidden flex-shrink-0 border ${isDark ? 'border-[#261619] bg-[#0A0808]' : 'border-[#E0DBD2] bg-[#F5F3EE]'}`}>
                  <ProductImagePlaceholder src={item.product.images?.[0]?.url} showBadge={false} alt={item.product.name} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#FF000E] font-medium uppercase tracking-wider">
                    {item.product.brandName || 'SHRELL OEM'}
                  </span>
                  <h2 className={`text-sm font-medium leading-snug ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                    <Link to={`/product/${item.product.slug}`} className="hover:text-[#FF000E] transition-colors">
                      {item.product.name}
                    </Link>
                  </h2>
                  <div className={`text-xs ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                    SKU: {item.product.sku} • {formatINR(item.unitPricePaisa)} each
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className={`flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
                <div className={`flex items-center border rounded-full ${isDark ? 'border-[#261619] bg-[#0A0808]' : 'border-[#E0DBD2] bg-[#F5F3EE]'}`}>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className={`px-3 py-1 min-h-[32px] min-w-[32px] cursor-pointer ${isDark ? 'text-[#8E8587] hover:text-[#F1EEEE]' : 'text-[#5C5456] hover:text-[#140E10]'}`}
                    aria-label="Decrease quantity"
                  >-</button>
                  <span className={`w-7 text-center text-xs font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stockQuantity}
                    className={`px-3 py-1 disabled:opacity-30 min-h-[32px] min-w-[32px] cursor-pointer ${isDark ? 'text-[#8E8587] hover:text-[#F1EEEE]' : 'text-[#5C5456] hover:text-[#140E10]'}`}
                    aria-label="Increase quantity"
                  >+</button>
                </div>

                <div className="text-right min-w-[90px]">
                  <div className={`text-sm font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                    {formatINR(item.subtotalPaisa)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className={`p-1.5 transition-colors cursor-pointer ${isDark ? 'text-[#8E8587] hover:text-[#FF2E3A]' : 'text-[#8E8587] hover:text-[#FF000E]'}`}
                  aria-label={`Remove ${item.product.name} from cart`}
                >
                  <i className="bi bi-trash3 text-base" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Actions */}
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border space-y-4 ${isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-[#E0DBD2]'}`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider border-b pb-3 ${isDark ? 'text-[#F1EEEE] border-[#261619]' : 'text-[#140E10] border-[#E0DBD2]'}`}>
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className={isDark ? 'text-[#D8D1D1]' : 'text-[#5C5456]'}>Subtotal ({cart.items.length} items)</span>
                <span className={`font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>{formatINR(cart.subtotalPaisa)}</span>
              </div>
              {cart.discountPaisa > 0 && (
                <div className="flex justify-between text-[#FF000E] font-medium">
                  <span>Coupon Discount ({cart.appliedCoupon?.code})</span>
                  <span>-{formatINR(cart.discountPaisa)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={isDark ? 'text-[#D8D1D1]' : 'text-[#5C5456]'}>Shipping Charges</span>
                <span className={`font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                  {cart.shippingPaisa === 0 ? 'FREE' : formatINR(cart.shippingPaisa)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-[#8E8587]' : 'text-[#8E8587]'}>Included GST (18%)</span>
                <span className={isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}>{formatINR(cart.taxPaisa)}</span>
              </div>
              <div className={`pt-3 border-t flex justify-between text-base font-semibold ${isDark ? 'border-[#261619] text-[#F1EEEE]' : 'border-[#E0DBD2] text-[#140E10]'}`}>
                <span>Final Payable</span>
                <span className="text-[#FF000E] font-bold">{formatINR(cart.totalPaisa)}</span>
              </div>
            </div>

            {/* Coupon Form */}
            <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
              {cart.appliedCoupon ? (
                <div className={`p-3 border rounded-lg flex items-center justify-between text-xs ${isDark ? 'bg-[#650008]/20 border-[#B0000A] text-[#F1EEEE]' : 'bg-[#FFE0E2] border-[#FFB3B7] text-[#140E10]'}`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <i className="bi bi-tag-fill text-[#FF000E]"></i>
                    <span>Coupon <strong>{cart.appliedCoupon.code}</strong> applied</span>
                  </div>
                  <button type="button" onClick={removeCoupon} className="text-[#8E8587] hover:text-[#FF000E] text-[11px] underline cursor-pointer">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label htmlFor="cart-coupon" className={`block text-[11px] font-medium uppercase ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                    Promotional Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="cart-coupon"
                      type="text"
                      placeholder="e.g. SHRELL10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className={`flex-1 border rounded-lg px-4 py-2 text-xs uppercase focus:outline-none focus:border-[#FF000E] ${isDark ? 'bg-[#0A0808] border-[#261619] text-[#F1EEEE]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'}`}
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponCode.trim()}
                      className={`px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50 border cursor-pointer ${isDark ? 'bg-[#1A1214] hover:bg-[#261619] text-[#F1EEEE] border-[#261619]' : 'bg-[#F5F3EE] hover:bg-[#EDE9E1] text-[#140E10] border-[#E0DBD2]'}`}
                    >
                      Apply
                    </button>
                  </div>
                  {couponMessage && (
                    <div className={`text-[11px] font-medium ${couponMessage.isError ? 'text-[#FF2E3A]' : 'text-emerald-500'}`}>
                      {couponMessage.text}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Checkout Action — with loader */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCheckingOut(true);
                  setTimeout(() => { setIsCheckingOut(false); openCheckout(); }, 500);
                }}
                disabled={isCheckingOut}
                className="w-full min-h-[46px] px-6 py-3.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                {isCheckingOut ? (
                  <ShrellLoader size={20} white />
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <i className="bi bi-arrow-right text-xs" aria-hidden="true"></i>
                  </>
                )}
              </button>
            </div>

            {/* Cart to WhatsApp alternative */}
            <div>
              <a
                href={whatsAppService.getCartToWhatsAppLink(cart)}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-[#130E10] hover:bg-[#1A1214] border-[#261619] text-[#D8D1D1] hover:text-[#F1EEEE]' : 'bg-[#F5F3EE] hover:bg-[#EDE9E1] border-[#E0DBD2] text-[#3A3030] hover:text-[#140E10]'}`}
              >
                <i className="bi bi-whatsapp text-emerald-500 text-base" aria-hidden="true"></i>
                <span>Order via WhatsApp Assistant</span>
              </a>
            </div>

            <div className={`pt-2 flex items-center justify-center gap-2 text-[11px] ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
              <i className="bi bi-shield-check text-[#FF000E] text-sm"></i>
              <span>COD & Direct Bank UPI Supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
