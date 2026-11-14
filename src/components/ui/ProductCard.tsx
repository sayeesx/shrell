import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';
import { ProductImagePlaceholder } from '../common/ProductImagePlaceholder';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addItem } = useCart();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const isInCart = cart.items.some((it) => it.productId === product.id);

  const isOutOfStock = product.stockQuantity <= 0;

  // Button state machine: 'idle' | 'adding' | 'added' | 'checkout'
  const [btnState, setBtnState] = useState<'idle' | 'adding' | 'added' | 'checkout'>(() =>
    !isOutOfStock && isInCart ? 'checkout' : 'idle'
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Sync state if cart changes externally or item is out of stock
  useEffect(() => {
    if ((!isInCart || isOutOfStock) && btnState === 'checkout') {
      setBtnState('idle');
    }
  }, [isInCart, isOutOfStock, btnState]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If button has transitioned to checkout, clicking it takes customer directly to cart/checkout
    if (btnState === 'checkout') {
      navigate('/cart');
      return;
    }

    if (btnState === 'adding' || btnState === 'added' || product.stockQuantity <= 0) return;

    setBtnState('adding');
    setTimeout(() => {
      const res = addItem(product, 1);
      if (res.success) {
        // 1. Show "Added to cart"
        setBtnState('added');
        // 2. Rotate with skew-sweep animation into "Checkout" button
        setTimeout(() => {
          setBtnState('checkout');
        }, 900);
      } else {
        setBtnState('idle');
      }
    }, 500);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const offersCount = 5 + ((product.id.charCodeAt(0) * 3) % 15);

  const isActionActive = !isOutOfStock && (btnState === 'added' || btnState === 'checkout');

  return (
    <motion.article
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={`group relative border rounded-xl overflow-hidden flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#0A0808] bg-gradient-to-b from-[#130E10] to-[#0A0808] border-[#221215] hover:border-[#4F242C]' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}
    >
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className={`block relative aspect-square sm:aspect-[4/3] border-b overflow-hidden ${isDark ? 'bg-[#080000] border-[#221215]' : 'bg-[#FFFEFA] border-[#E0DBD2]'}`}
      >
        <ProductImagePlaceholder
          src={product.images?.[0]?.url}
          alt={`${product.name} - SHRELL Automotive Accessory`}
        />

        {/* Top-left Product Label Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 pointer-events-none">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase bg-[#FF000E] text-white shadow-xs">
              {product.badge}
            </span>
          </div>
        )}

        {/* Top-right Wishlist Button with fluid spring tap */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.82 }}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-md backdrop-blur-xs border flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'bg-black/60 hover:bg-black/90 text-[#F1EEEE] border-[#261619]' : 'bg-white/80 hover:bg-white text-[#5C5456] border-[#E0DBD2]'}`}
        >
          <i
            className={`bi ${isWishlisted ? 'bi-heart-fill text-[#FF000E]' : 'bi-heart'} text-xs sm:text-sm leading-none transition-transform`}
            aria-hidden="true"
          ></i>
        </motion.button>

        {/* Bottom Image Overlay Offers Badge */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border backdrop-blur-xs ${isDark ? 'bg-[#0A0808]/90 text-[#F1EEEE] border-[#261619]' : 'bg-white/90 text-[#3A3030] border-[#E0DBD2]'}`}>
            <i className="bi bi-tag-fill text-[#FF000E] text-[10px]" aria-hidden="true"></i>
            <span>{offersCount}+ offers</span>
          </span>
        </div>
      </Link>

      {/* Body Metadata */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-xs sm:text-sm font-medium line-clamp-2 leading-snug transition-colors min-h-[2.2rem] sm:min-h-[2.5rem] ${isDark ? 'text-[#F1EEEE] group-hover:text-[#FF000E]' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>

        {/* Pricing and Action Row */}
        <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-1.5 ${isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'}`}>
          {/* Price Stack — hides smoothly when in active action state */}
          <div
            className={`min-w-0 transition-all duration-300 ${
              isActionActive ? 'opacity-0 invisible w-0 overflow-hidden m-0 p-0' : 'opacity-100'
            }`}
          >
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className={`text-sm sm:text-base font-bold font-tight tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-[10px] sm:text-xs text-[#7A7575] line-through font-tight">
                  {formatINR(product.compareAtPricePaisa)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Add Button or No Stock Indicator */}
          <motion.button
            type="button"
            whileTap={isOutOfStock ? undefined : { scale: 0.94 }}
            onClick={handleButtonClick}
            disabled={isOutOfStock || btnState === 'adding'}
            className={`shrell-cart-btn ${!isOutOfStock && btnState === 'added' ? 'is-added' : ''} ${!isOutOfStock && btnState === 'checkout' ? 'is-checkout' : ''} relative min-h-[32px] sm:min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold flex items-center justify-center transition-all flex-shrink-0 select-none outline-none focus:outline-none focus:ring-0 disabled:opacity-100 ${
              isOutOfStock
                ? isDark
                  ? 'bg-[#1A1214] text-[#8E8587] cursor-not-allowed border border-[#261619] min-w-[75px] sm:min-w-[85px]'
                  : 'bg-[#F0EDE6] text-[#7A7575] cursor-not-allowed border border-[#E0DBD2] min-w-[75px] sm:min-w-[85px]'
                : btnState === 'checkout'
                  ? 'bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white w-full shadow-sm cursor-pointer'
                  : btnState === 'added'
                    ? 'bg-[#FF000E] text-white w-full'
                    : btnState === 'adding'
                      ? 'bg-[#FF000E] text-white cursor-wait min-w-[70px] sm:min-w-[80px]'
                      : 'bg-[#FF000E] hover:bg-[#E0000C] active:bg-[#CC000B] text-white min-w-[70px] sm:min-w-[80px]'
            }`}
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : btnState === 'checkout'
                  ? `Proceed to cart for ${product.name}`
                  : btnState === 'added'
                    ? `Added ${product.name} to cart`
                    : `Add ${product.name} to cart`
            }
          >
            {/* Default state (Add + Shrell icon, loading spinner, or no stock) */}
            <span className="btn-default-content flex items-center justify-center gap-1.5">
              {btnState === 'adding' ? (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="opacity-100"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : isOutOfStock ? (
                <span className="font-semibold text-[11px] sm:text-xs tracking-tight">no stock</span>
              ) : (
                <>
                  <svg
                    viewBox="270 277 1386 1383"
                    className="w-3.5 h-3.5 fill-current flex-shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M290,430 Q290,297 420,297 L1150,297 L1050,435 Q1010,483 950,483 L745,483 Q690,490 655,522 L470,730 Q440,775 430,850 L420,950 Q400,1050 292,1065 Z" />
                    <path d="M880,580 L985,581 L545,1112 Q520,1135 490,1135 L430,1135 Q405,1130 405,1103 Q405,1090 415,1080 L790,630 Q830,585 880,580 Z" />
                    <path d="M1415,297 L1510,297 Q1630,300 1636,430 L1636,662 L1340,662 Q1290,670 1255,710 L930,1110 L650,1282 Q620,1313 570,1313 L290,1313 L290,1520 Q295,1635 415,1640 L520,1640 Z" />
                    <path d="M1410,838 L1500,838 Q1525,845 1522,875 L1150,1315 Q1110,1360 1050,1360 L950,1360 L1370,865 Q1390,840 1410,838 Z" />
                    <path d="M1636,910 L1636,1520 Q1630,1635 1510,1640 L750,1640 L840,1515 Q880,1490 935,1488 L1355,1488 Q1430,1480 1448,1400 L1505,1050 Q1530,925 1636,910 Z" />
                  </svg>
                  <span>Add</span>
                </>
              )}
            </span>

            {/* Added state sliding up with skewed sweep */}
            <span className="btn-added-content">
              <i className="bi bi-check-lg text-sm leading-none" aria-hidden="true"></i>
              <span>Added to cart</span>
            </span>

            {/* Rotated Checkout / Order Now state with round-background arrow */}
            <span className="btn-checkout-content flex items-center justify-center gap-1.5 font-bold">
              <span>Checkout</span>
              <span className="w-4.5 h-4.5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                <i className="bi bi-arrow-right text-[10px] leading-none" aria-hidden="true"></i>
              </span>
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
