import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { useCart } from '../../application/CartContext';
import { ProductImagePlaceholder } from '../common/ProductImagePlaceholder';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = addItem(product, 1);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const isOutOfStock = product.stockQuantity <= 0;

  // Calculate savings
  const savingsPaisa =
    product.compareAtPricePaisa && product.compareAtPricePaisa > product.pricePaisa
      ? product.compareAtPricePaisa - product.pricePaisa
      : 0;

  const offersCount = 5 + ((product.id.charCodeAt(0) * 3) % 15);

  return (
    <article className="group relative bg-[#0A0808] bg-gradient-to-b from-[#130E10] to-[#0A0808] border border-[#221215] hover:border-[#4F242C] rounded-xl overflow-hidden flex flex-col transition-all duration-200">
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative aspect-square sm:aspect-[4/3] bg-[#080000] border-b border-[#221215] overflow-hidden"
      >
        <ProductImagePlaceholder alt={product.name} />

        {/* Top-right Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-black/60 hover:bg-black/90 backdrop-blur-xs text-[#F1EEEE] border border-[#261619] flex items-center justify-center transition-colors"
        >
          <i
            className={`bi ${isWishlisted ? 'bi-heart-fill text-[#FF000E]' : 'bi-heart'} text-xs sm:text-sm leading-none`}
            aria-hidden="true"
          ></i>
        </button>

        {/* Bottom Image Overlay Offers Badge */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-[#0A0808]/90 text-[#F1EEEE] border border-[#261619] backdrop-blur-xs">
            <i className="bi bi-tag-fill text-[#FF000E] text-[10px]" aria-hidden="true"></i>
            <span>{offersCount}+ offers</span>
          </span>
        </div>
      </Link>

      {/* Body Metadata */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Title (Refined font weight, clean line-height) */}
          <h3 className="text-xs sm:text-sm font-medium text-[#F1EEEE] line-clamp-2 leading-snug group-hover:text-[#FF000E] transition-colors min-h-[2.2rem] sm:min-h-[2.5rem]">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>

        {/* Pricing and Action Row */}
        <div className="mt-2 pt-2 border-t border-[#221215] flex items-center justify-between gap-1.5">
          {/* Price Stack */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-[#F1EEEE] tracking-tight">
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-[10px] sm:text-xs text-[#7A7575] line-through">
                  {formatINR(product.compareAtPricePaisa)}
                </span>
              )}
            </div>

            {savingsPaisa > 0 && (
              <div className="text-[10px] sm:text-[11px] font-medium text-emerald-400 truncate">
                Save {formatINR(savingsPaisa)}
              </div>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`min-h-[32px] sm:min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all flex-shrink-0 ${
              added
                ? 'bg-[#E0000C] text-white'
                : isOutOfStock
                ? 'bg-[#1A1214] text-[#7A7575] cursor-not-allowed border border-[#261619]'
                : 'bg-[#FF000E] hover:bg-[#E0000C] text-white active:scale-95'
            }`}
            aria-label={
              isOutOfStock
                ? `${product.name} is sold out`
                : added
                ? `Added ${product.name} to cart`
                : `Add ${product.name} to cart`
            }
          >
            {added ? (
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
