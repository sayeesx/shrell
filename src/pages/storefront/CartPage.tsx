import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useCart } from '../../application/CartContext';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository } from '../../infrastructure/repositories';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { CheckoutFlowTopBar } from '../../components/checkout/CheckoutFlowTopBar';
import { LeaveCheckoutConfirmModal } from '../../components/checkout/LeaveCheckoutConfirmModal';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { trackCartViewed } from '../../infrastructure/analytics/posthog';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import Basket from '../../components/ui/hairline-basket';

export const CartPage: React.FC = () => {
  const { cart, settings, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, addItem } = useCart();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

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

  useEffect(() => {
    trackCartViewed(cart);
  }, []);

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

  // Free shipping threshold (₹300 = 30000 Paisa)
  const freeThreshold = settings?.freeShippingThresholdPaisa || 30000;
  const standardFee = settings?.standardShippingPaisa || 6000;
  const remainingForFreeShipping = Math.max(0, freeThreshold - cart.subtotalPaisa);
  const progressPercent = Math.min(100, Math.round((cart.subtotalPaisa / freeThreshold) * 100));
  const isFreeDeliveryUnlocked = remainingForFreeShipping === 0;

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile celebration popup modal for Free Express Shipping (show once per product set, or when a new product is added)
  const FREE_DELIVERY_SEEN_KEY = 'shrell_free_delivery_seen_products_v1';
  const [showFreeDeliveryModal, setShowFreeDeliveryModal] = useState(false);
  const [deliveryModalCountdown, setDeliveryModalCountdown] = useState(3);
  const suppressFreeDeliveryPopupRef = useRef(false);

  useBodyScrollLock(showFreeDeliveryModal);

  useEffect(() => {
    if (suppressFreeDeliveryPopupRef.current) {
      suppressFreeDeliveryPopupRef.current = false;
      return;
    }

    const currentIds = cart.items.map((item) => item.productId);
    const currentSet = new Set(currentIds);

    let seenIds: string[] = [];
    try {
      const raw = localStorage.getItem(FREE_DELIVERY_SEEN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          seenIds = parsed.filter((id): id is string => typeof id === 'string');
        }
      }
    } catch {
      seenIds = [];
    }

    // Prune products that were removed from the cart so re-adding a removed item later or clearing cart resets cleanly
    const prunedSeen = seenIds.filter((id) => currentSet.has(id));
    if (prunedSeen.length !== seenIds.length) {
      try {
        if (prunedSeen.length === 0) {
          localStorage.removeItem(FREE_DELIVERY_SEEN_KEY);
        } else {
          localStorage.setItem(FREE_DELIVERY_SEEN_KEY, JSON.stringify(prunedSeen));
        }
      } catch {
        // Ignore storage write errors
      }
    }

    if (!isFreeDeliveryUnlocked || currentIds.length === 0) {
      return;
    }

    const seenSet = new Set(prunedSeen);
    const hasNewProduct = currentIds.some((id) => !seenSet.has(id));

    if (hasNewProduct) {
      try {
        localStorage.setItem(FREE_DELIVERY_SEEN_KEY, JSON.stringify(currentIds));
      } catch {
        // Ignore storage write errors
      }
      setShowFreeDeliveryModal(true);
      try {
        const confettiColors = isDark
          ? ['#FF000E', '#E0000C', '#FF000E', '#D4D0D0', '#E5E5E5']
          : ['#FF000E', '#CC000B', '#E0000C', '#140E10', '#000000'];

        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 },
          colors: confettiColors,
          zIndex: 100000,
        });
      } catch (err) {
        console.error('Confetti trigger failed:', err);
      }
    }
  }, [isMobile, isFreeDeliveryUnlocked, cart.items, isDark]);

  // Allow closing free delivery modal with Escape
  useEffect(() => {
    if (!showFreeDeliveryModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFreeDeliveryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFreeDeliveryModal]);

  // Auto-close free delivery modal with dynamic 3, 2, 1 countdown
  useEffect(() => {
    if (!showFreeDeliveryModal) return;
    setDeliveryModalCountdown(3);

    const interval = setInterval(() => {
      setDeliveryModalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowFreeDeliveryModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showFreeDeliveryModal]);

  const handleAddSuggestion = (prod: Product) => {
    try {
      const raw = localStorage.getItem(FREE_DELIVERY_SEEN_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && !parsed.includes(prod.id)) {
        localStorage.setItem(FREE_DELIVERY_SEEN_KEY, JSON.stringify([...parsed, prod.id]));
      }
    } catch {}
    suppressFreeDeliveryPopupRef.current = true;
    addItem(prod, 1);
  };

  const getShortTitle = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length <= 3) return name;
    return `${words.slice(0, 3).join(' ')}..`;
  };

  const renderFreeDeliveryCelebrationModal = () => {
    if (typeof document === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {showFreeDeliveryModal && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overscroll-contain touch-none"
            style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="free-delivery-title"
            onClick={() => setShowFreeDeliveryModal(false)}
          >
            {/* Full-bleed blurred backdrop with zero top gap */}
            <motion.div
              key="free-delivery-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 modal-backdrop-solid"
              aria-hidden="true"
            />

            <motion.div
              key="free-delivery-card"
              initial={{ opacity: 0, scale: 0.93, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 14 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`relative z-10 w-full max-w-sm rounded-2xl border overflow-hidden shadow-2xl flex items-stretch ${
                isDark ? 'bg-[#120E0F] border-[#2D161A] text-[#F1EEEE]' : 'bg-[#E9E9E9] border-[#D0C9BE] text-[#140E10]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: Man Holding Box Image covering full modal height without expanding height */}
              <div className="relative w-[40%] shrink-0 overflow-hidden select-none">
                <img
                  src="/images/man-holding-box.webp"
                  alt="SHRELL delivery partner holding express package"
                  width={400}
                  height={500}
                  className="absolute inset-0 w-full h-full object-cover object-[center_18%]"
                />
              </div>

              {/* Right Side: Celebration Message & Action */}
              <div className="flex-1 min-w-0 p-4 flex flex-col justify-center space-y-2.5 text-left">
                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={() => setShowFreeDeliveryModal(false)}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#1A1214] border-[#2D161A] text-slate-300 hover:text-white'
                      : 'bg-[#DCDCDC] border-[#C6C0B8] text-[#4A4244] hover:text-[#140E10]'
                  }`}
                  aria-label="Close free delivery celebration modal"
                >
                  <i className="bi bi-x-lg text-xs" aria-hidden="true" />
                </button>

                <div className="space-y-1.5 pr-6">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-black uppercase tracking-wider bg-[#FF000E] text-white">
                    <i className="bi bi-unlock-fill text-[10px]" aria-hidden="true" />
                    <span>FREE SHIPPING</span>
                  </span>
                  <h3 id="free-delivery-title" className="text-base font-bold leading-snug tracking-tight">
                    Free Express Surface Delivery!
                  </h3>
                  <p className={`text-[11.5px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#4A4244]'}`}>
                    Your order qualifies for zero shipping charge with priority dispatch across India.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFreeDeliveryModal(false)}
                  className="w-full py-2 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Got it, Continue
                </button>
                <p className={`text-[10.5px] text-center font-normal pt-0.5 tracking-tight ${isDark ? 'text-slate-400' : 'text-[#7A7575]'}`}>
                  Redirecting to your cart in {deliveryModalCountdown}...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const renderDeliveryTimeline = (compact = false) => (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        compact ? 'p-3 space-y-2.5 my-2' : 'p-4 space-y-3'
      } ${
        isDark
          ? isFreeDeliveryUnlocked
            ? 'bg-[#120E0F] border-[#361B20]'
            : 'bg-[#120E0F] border-[#261619]'
          : isFreeDeliveryUnlocked
            ? 'bg-[#FFFFFF] border-[#E0DBD2]'
            : 'bg-[#FFFFFF] border-[#E0DBD2]'
      }`}
    >
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 flex items-center justify-center">
            <img
              src="/images/shrell-delivery.webp"
              alt="Express Delivery"
              className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} object-contain drop-shadow-sm transition-transform duration-500 ${
                isFreeDeliveryUnlocked ? 'scale-105' : 'hover:scale-105'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/shrell-delivery.webp';
              }}
            />
            {isFreeDeliveryUnlocked && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF000E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF000E]" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            {isFreeDeliveryUnlocked ? (
              <div className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                isDark ? 'text-white' : 'text-[#140E10]'
              }`}>
                Unlocked: Free Express Surface Shipping across India!
              </div>
            ) : (
              <div className="text-xs font-medium truncate">
                Add <span className="font-bold text-[#FF000E] font-mono">{formatINR(remainingForFreeShipping)}</span> more to gain Free Delivery!
              </div>
            )}
            <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
              {isFreeDeliveryUnlocked
                ? 'Zero delivery charge • Express logistics dispatch'
                : `Delivery charge: ${formatINR(standardFee)} for orders under ${formatINR(freeThreshold)}`}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {isFreeDeliveryUnlocked ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold uppercase tracking-wider bg-[#FF000E] text-white shadow-xs">
              FREE
            </span>
          ) : (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${
              isDark ? 'bg-surface-900 border-[#261619] text-slate-300' : 'bg-[#F5F3EE] border-[#E0DBD2] text-slate-700'
            }`}>
              Threshold ₹300
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Animated Timeline Track */}
      <div className="space-y-1">
        <div className="relative w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-visible">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#850009] via-[#E0000C] to-[#FF000E]"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Smooth Moving Delivery Van Indicator along the timeline */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out pointer-events-none"
            style={{
              left: `calc(${progressPercent}% - 14px)`,
              opacity: progressPercent > 5 ? 1 : 0,
            }}
          >
            <div className={`w-7 h-7 -mt-0.5 rounded-full p-0.5 border flex items-center justify-center shadow-md transition-transform duration-500 ${
              isFreeDeliveryUnlocked
                ? 'bg-[#FF000E] border-white text-white scale-110'
                : isDark
                  ? 'bg-[#120E0F] border-[#FF000E]/50'
                  : 'bg-white border-[#FF000E]/30'
            }`}>
              <img
                src="/images/shrell-delivery.webp"
                alt="Express"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/shrell-delivery.webp';
                }}
              />
            </div>
          </div>
        </div>

        {/* Milestone Steps Markers */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
          <span>₹0</span>
          <span>{formatINR(Math.round(freeThreshold / 2))}</span>
          <span className={isFreeDeliveryUnlocked ? 'text-[#FF000E] font-bold' : 'font-medium'}>
            {formatINR(freeThreshold)} (Free Delivery)
          </span>
        </div>
      </div>
    </div>
  );

  // Suggestions excluding items already at maximum quantity
  const displayedSuggestions = suggestions.filter((p) => {
    const inCart = cart.items.find((it) => it.productId === p.id);
    return !inCart || inCart.quantity < p.stockQuantity;
  }).slice(0, 6);

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
      }`}>
        <SEOHead
          title="Shopping Cart | SHRELL Automotive"
          description="Review your selected automotive accessories and equipment before checkout."
          noIndex={true}
        />
        {/* Top Header - Shared coordinate alignment across Cart & Checkout */}
        <CheckoutFlowTopBar
          title="My Cart"
          onBack={() => navigate(-1)}
          backLabel="Go back"
          rightSlot={<ThemeToggle compact />}
        />

        {/* Empty Cart Body - Centered in remaining viewport space */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center space-y-5 pb-20">
          <div className="flex items-center justify-center mx-auto">
            <Basket style={{ width: 180, height: 180 }} label="An empty wire shopping basket" />
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
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
    }`}>
      <SEOHead
        title="Shopping Cart | SHRELL Automotive"
        description="Review your selected automotive accessories and equipment before checkout."
        noIndex={true}
      />

      {/* 1. Mobile Header (Back button | My Cart | Theme toggle) - Locked coordinates */}
      <div className="md:hidden">
        <CheckoutFlowTopBar
          title="My Cart"
          onBack={() => setIsLeaveModalOpen(true)}
          backLabel="Go back"
          rightSlot={<ThemeToggle compact />}
        />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT                                                             */}
      {/* ========================================================================= */}
      <div className="block md:hidden max-w-md mx-auto px-3.5 py-2.5 pb-32 sm:pb-36 space-y-2">

        {/* Dynamic Delivery Timeline (Mobile): show timeline if not yet unlocked, or modal is shown if unlocked */}
        {!isFreeDeliveryUnlocked && renderDeliveryTimeline(true)}

        {/* 2. Cart Items List (Compact size, top-right delete, stepper on right) */}
        <div className="space-y-2">
          {cart.items.map((item) => {
            const rawImg = item.product.images?.[0]?.url || '';
            const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
              ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
              : rawImg;
            const hasRealImg = Boolean(
              cleanImg &&
              !cleanImg.includes('shrell-full_white-text_black-logo.png') &&
              !cleanImg.includes('shrell-blacktext-redlogo.png') &&
              !cleanImg.includes('shrell-logo-white.png') &&
              !cleanImg.includes('shrell-brandicon')
            );
            const isImageAvailable = hasRealImg && !failedImages[item.productId];
            const productHref = `/product/${item.product.slug || item.product.id || item.productId}`;

            return (
              <div
                key={item.productId}
                className={`p-2 rounded-xl border transition-all duration-200 flex items-center gap-2.5 ${
                  isDark ? 'bg-[#130E10] border-[#2D161A]' : 'bg-white border-[#D0C9BE] shadow-xs'
                }`}
              >
                {/* Product image (clean compact square frame) */}
                <Link
                  to={productHref}
                  aria-label={`View ${item.product.name}`}
                  className={`w-16 h-16 shrink-0 aspect-square rounded-lg flex items-center justify-center p-1.5 overflow-hidden border transition-opacity hover:opacity-85 ${
                    isDark ? 'bg-[#181113] border-[#2D161A]' : 'bg-[#F5F3EE] border-[#D0C9BE]'
                  }`}
                >
                  {isImageAvailable ? (
                    <img
                      src={cleanImg}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain aspect-square"
                      onError={() => handleImageError(item.productId)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-40">
                      <img
                        src="/logos/shrell-brandicon_no-bg.png"
                        alt="SHRELL"
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-0.5">
                  {/* Title & Top-Right Delete Button */}
                  <div className="flex items-start justify-between gap-1">
                    <Link
                      to={productHref}
                      className="font-bold text-xs leading-snug line-clamp-1 block hover:text-[#FF000E] transition-colors flex-1 min-w-0"
                    >
                      {item.product.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="w-5 h-5 -mr-0.5 -mt-0.5 rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF000E] hover:bg-[#FF000E]/10 transition-colors cursor-pointer shrink-0 active:scale-90"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <i className="bi bi-trash3 text-[11px]" />
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 dark:text-[#8E8587] truncate mt-0.5">
                    {item.product.categoryName || 'OEM Automotive'} {item.product.sku ? `| ${item.product.sku}` : ''}
                  </p>

                  {/* Price on Left, Quantity Stepper at Position of Remove (Right) */}
                  <div className="flex items-center justify-between pt-1 mt-0.5">
                    <p className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                      {formatINR(item.unitPricePaisa)}
                    </p>

                    {/* Stepper placed at the position where Remove used to be */}
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
        {/* 4. PRODUCT SUGGESTIONS (Add More Items Carousel)                          */}
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
                    className={`w-28 shrink-0 snap-start p-1.5 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#130E10] border-[#2D161A]' : 'bg-white border-[#D0C9BE] shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Image Container filling card width with clean margin padding */}
                      <div className={`w-full aspect-square rounded-lg flex items-center justify-center p-1.5 overflow-hidden border ${
                        isDark ? 'bg-[#181113] border-[#2D161A]' : 'bg-[#F5F3EE] border-[#D0C9BE]'
                      }`}>
                        {prod.images?.[0]?.url && !prod.images[0].url.includes('shrell-') && !failedImages[`sug-${prod.id}`] ? (
                          <img
                            src={prod.images[0].url}
                            alt={prod.name}
                            className="w-full h-full object-contain aspect-square"
                            onError={() => handleImageError(`sug-${prod.id}`)}
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
                      <Link
                        to={`/product/${prod.slug}`}
                        className="font-bold text-[11px] leading-tight mt-1.5 block hover:text-[#FF000E] transition-colors truncate"
                        title={prod.name}
                      >
                        {getShortTitle(prod.name)}
                      </Link>
                      <p className={`font-extrabold text-xs mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
                        {formatINR(prod.pricePaisa)}
                      </p>
                    </div>

                    <div className={`mt-1.5 pt-1 border-t ${isDark ? 'border-[#2D161A]' : 'border-[#D0C9BE]'}`}>
                      {currentQty > 0 ? (
                        <div className="w-full h-7 rounded-lg bg-[#FF000E] text-white px-2 font-bold text-xs flex items-center justify-between shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, currentQty - 1)}
                            className="w-5 h-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform text-sm leading-none"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="font-mono text-xs select-none">{currentQty}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, currentQty + 1)}
                            disabled={currentQty >= prod.stockQuantity}
                            className="w-5 h-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-40 text-sm leading-none"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddSuggestion(prod)}
                          disabled={prod.stockQuantity <= 0}
                          className="w-full h-7 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center shadow-xs"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Trailing spacer so last item scrolls comfortably clear of margin */}
              <div className="w-1.5 shrink-0" aria-hidden="true" />
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

          <div className={`pt-1.5 border-t flex justify-between items-center ${isDark ? 'border-[#2D161A]' : 'border-[#D0C9BE]'}`}>
            <span className="font-bold text-xs sm:text-sm">Total</span>
            <span className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-black'}`}>
              {formatINR(cart.totalPaisa)}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE FIXED BOTTOM CTA BUTTON (Flush above dock text carousel)           */}
      {/* ========================================================================= */}
      <div
        className={`fixed left-0 right-0 z-50 md:hidden py-2 px-3 border-t backdrop-blur-xl transition-all ${
          isDark
            ? 'bg-[#0A0808]/95 border-[#2D161A] shadow-[0_-8px_25px_rgba(0,0,0,0.85)]'
            : 'bg-white/95 border-[#D0C9BE] shadow-[0_-4px_18px_rgba(0,0,0,0.1)]'
        }`}
        style={{ bottom: 'var(--mobile-dock-height, 70px)' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="shrink-0 min-w-0 pr-1">
            <span className="text-[11px] text-gray-400 block leading-tight">Total</span>
            <span className={`font-extrabold text-base sm:text-lg font-mono tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {formatINR(cart.totalPaisa)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="shrink-0 h-11 px-3.5 sm:px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              aria-label="Go back"
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE] hover:bg-[#1C1416]'
                  : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10] hover:bg-[#EDE9E1]'
              }`}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 block"
                aria-hidden="true"
              >
                <path d="M10.2 3.2L5.4 8L10.2 12.8" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">My Shopping Cart</h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8587]' : 'text-[#706869]'}`}>
                {cart.items.length} unique automotive equipment accessory item(s) selected
              </p>
            </div>
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

        {/* Dynamic Delivery Timeline (Desktop - only shown before reaching free shipping threshold) */}
        {!isFreeDeliveryUnlocked && renderDeliveryTimeline(false)}

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* Left Column (8 cols): Items list + Instamart Recommendations */}
          <div className="col-span-7 lg:col-span-8 space-y-3.5">
            {cart.items.map((item) => {
              const rawImg = item.product.images?.[0]?.url || '';
              const cleanImg = rawImg.startsWith('http://res.cloudinary.com/')
                ? rawImg.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/')
                : rawImg;
              const hasRealImg = Boolean(
                cleanImg &&
                !cleanImg.includes('shrell-full_white-text_black-logo.png') &&
                !cleanImg.includes('shrell-blacktext-redlogo.png') &&
                !cleanImg.includes('shrell-logo-white.png') &&
                !cleanImg.includes('shrell-brandicon')
              );
              const isImageAvailable = hasRealImg && !failedImages[`desk-${item.productId}`];
              const productHref = `/product/${item.product.slug || item.product.id || item.productId}`;

              return (
                <div
                  key={item.productId}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                    isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
                  }`}
                >
                  {/* Product Image Frame */}
                  <Link
                    to={productHref}
                    aria-label={`View ${item.product.name}`}
                    className={`w-20 h-20 shrink-0 rounded-lg flex items-center justify-center p-2 overflow-hidden border transition-opacity hover:opacity-85 ${
                      isDark ? 'bg-[#181113] border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                    }`}
                  >
                    {isImageAvailable ? (
                      <img
                        src={cleanImg}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={() => handleImageError(`desk-${item.productId}`)}
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
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={productHref}
                          className="font-bold text-sm leading-snug line-clamp-1 hover:text-[#FF000E] transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.product.categoryName || 'OEM Automotive Equipment'} {item.product.sku ? `• SKU: ${item.product.sku}` : ''}
                        </p>
                      </div>

                      <span className={`font-extrabold text-base shrink-0 ${isDark ? 'text-white' : 'text-black'}`}>
                        {formatINR(item.unitPricePaisa)}
                      </span>
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
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
                            {prod.images?.[0]?.url && !prod.images[0].url.includes('shrell-') && !failedImages[`desk-sug-${prod.id}`] ? (
                              <img
                                src={prod.images[0].url}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                                onError={() => handleImageError(`desk-sug-${prod.id}`)}
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
                          <Link
                            to={`/product/${prod.slug}`}
                            className="font-bold text-xs line-clamp-1 leading-snug mt-1.5 block hover:text-[#FF000E] transition-colors"
                          >
                            {prod.name}
                          </Link>
                          <p className={`font-extrabold text-xs mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
                            {formatINR(prod.pricePaisa)}
                          </p>
                        </div>

                        <div className={`mt-2 pt-1.5 border-t ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
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
              <h2 className={`font-bold text-xs uppercase tracking-wider border-b pb-2 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
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

              <div className={`pt-2 border-t flex justify-between items-center ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                <span className="font-bold text-sm">Total</span>
                <span className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-black'}`}>
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
              <div className={`pt-2 flex items-center justify-center gap-3 text-[10.5px] text-gray-400 border-t ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
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

      {/* Mobile Celebration Modal for Free Delivery (Portaled to document.body) */}
      {renderFreeDeliveryCelebrationModal()}

      {/* Sad Cat Exit Confirmation Modal */}
      <LeaveCheckoutConfirmModal
        isOpen={isLeaveModalOpen}
        itemName={cart.items.length === 1 ? cart.items[0].product.name : cart.items.length > 1 ? 'Your items' : undefined}
        onContinueOrder={() => {
          setIsLeaveModalOpen(false);
        }}
        onConfirmLeave={() => {
          setIsLeaveModalOpen(false);
          navigate('/');
        }}
      />
    </div>
  );
};
