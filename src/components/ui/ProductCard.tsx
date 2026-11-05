import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';
import { ProductImagePlaceholder } from '../common/ProductImagePlaceholder';
import { ShrellLoader } from '../common/ShrellLoader';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { isDark } = useTheme();
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || added) return;
    setIsAdding(true);
    // Small delay to show loader then confirm
    setTimeout(() => {
      const res = addItem(product, 1);
      setIsAdding(false);
      if (res.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    }, 600);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const isOutOfStock = product.stockQuantity <= 0;

  const offersCount = 5 + ((product.id.charCodeAt(0) * 3) % 15);

  return (
    <article className={`group relative border rounded-xl overflow-hidden flex flex-col transition-all duration-200 ${isDark ? 'bg-[#0A0808] bg-gradient-to-b from-[#130E10] to-[#0A0808] border-[#221215] hover:border-[#4F242C]' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className={`block relative aspect-square sm:aspect-[4/3] border-b overflow-hidden ${isDark ? 'bg-[#080000] border-[#221215]' : 'bg-[#FFFEFA] border-[#E0DBD2]'}`}
      >
        <ProductImagePlaceholder src={product.images?.[0]?.url} alt={product.name} />

        {/* Top-right Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-md backdrop-blur-xs border flex items-center justify-center transition-colors ${isDark ? 'bg-black/60 hover:bg-black/90 text-[#F1EEEE] border-[#261619]' : 'bg-white/80 hover:bg-white text-[#5C5456] border-[#E0DBD2]'}`}
        >
          <i
            className={`bi ${isWishlisted ? 'bi-heart-fill text-[#FF000E]' : 'bi-heart'} text-xs sm:text-sm leading-none`}
            aria-hidden="true"
          ></i>
        </button>

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
          {/* Price Stack */}
          <div className="min-w-0">
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

          {/* Quick Add Button — shows ShrellLoader (white) while adding */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`relative min-h-[32px] sm:min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all flex-shrink-0 overflow-hidden ${
              added
                ? 'bg-[#E0000C] text-white min-w-[70px] sm:min-w-[80px]'
                : isAdding
                  ? 'bg-[#FF000E] text-white cursor-wait min-w-[70px] sm:min-w-[80px]'
                  : isOutOfStock
                    ? isDark
                      ? 'bg-[#1A1214] text-[#7A7575] cursor-not-allowed border border-[#261619] min-w-[70px] sm:min-w-[80px]'
                      : 'bg-[#F0EDE6] text-[#9E9898] cursor-not-allowed border border-[#E0DBD2] min-w-[70px] sm:min-w-[80px]'
                    : 'bg-[#FF000E] hover:bg-[#E0000C] text-white active:scale-95 min-w-[70px] sm:min-w-[80px]'
            }`}
            aria-label={
              isOutOfStock
                ? `${product.name} is sold out`
                : added
                  ? `Added ${product.name} to cart`
                  : `Add ${product.name} to cart`
            }
          >
            {isAdding ? (
              <ShrellLoader size={16} white />
            ) : added ? (
              <>
                <i className="bi bi-check-lg text-sm" aria-hidden="true"></i>
                <span className="hidden sm:inline">Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Out</span>
            ) : (
              <>
                <i className="bi bi-cart-plus text-xs" aria-hidden="true"></i>
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
