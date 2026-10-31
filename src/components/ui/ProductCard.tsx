import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { useCart } from '../../application/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const primaryImage =
    product.images.find((img) => img.isPrimary) ||
    product.images[0] || {
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      altText: product.name,
    };

  const [imgSrc, setImgSrc] = useState(primaryImage.url);

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
    <article className="group relative bg-white border border-gray-200/90 rounded-lg overflow-hidden flex flex-col transition-all duration-200">
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative aspect-square sm:aspect-[4/3] bg-gray-100 overflow-hidden"
      >
        <img
          src={imgSrc}
          onError={() =>
            setImgSrc(
              'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
            )
          }
          alt={primaryImage.altText || product.name}
          width={600}
          height={450}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top-right Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-black/30 hover:bg-black/50 backdrop-blur-xs text-white flex items-center justify-center transition-colors"
        >
          <i
            className={`bi ${isWishlisted ? 'bi-heart-fill text-brand-500' : 'bi-heart'} text-xs sm:text-sm leading-none`}
            aria-hidden="true"
          ></i>
        </button>

        {/* Bottom Image Overlay Offers Badge */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-white/95 text-gray-900 border border-gray-200/60 backdrop-blur-xs">
            <i className="bi bi-fire text-amber-500 text-xs" aria-hidden="true"></i>
            <span>{offersCount}+ offers</span>
          </span>
        </div>
      </Link>

      {/* Body Metadata */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Product Title (No brand prefix, clean line-height) */}
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors min-h-[2.2rem] sm:min-h-[2.5rem]">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>

        {/* Pricing and Action Row */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
          {/* Price Stack */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formatINR(product.compareAtPricePaisa)}
                </span>
              )}
            </div>

            {savingsPaisa > 0 && (
              <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 truncate">
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
                ? 'bg-emerald-600 text-white'
                : isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600 text-white active:scale-95'
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
