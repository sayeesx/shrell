import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository } from '../../infrastructure/repositories';
import { useCart } from '../../application/CartContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { HalfArrowIcon } from '../../components/common/HalfArrowIcon';
import { ProductImagePlaceholder } from '../../components/common/ProductImagePlaceholder';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedMessage, setAddedMessage] = useState<string>('');
  const [imageErrorMap, setImageErrorMap] = useState<{ [index: number]: boolean }>({});

  // Accordion open states
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    specs: false,
    shipping: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      setImageErrorMap({});
      try {
        const p = await productRepository.getBySlug(slug);
        if (p) {
          setProduct(p);
          setActiveImageIndex(0);
          setQuantity(1);

          const relatedRes = await productRepository.getAll({ categorySlug: p.categoryId, limit: 4 });
          setRelatedProducts(relatedRes.products.filter((item) => item.id !== p.id));
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        });
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 50);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F14] text-white py-12">
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="aspect-square bg-surface-900 border border-surface-800 rounded-xl animate-pulse" />
            <div className="space-y-4 pt-4">
              <div className="h-4 w-1/4 bg-surface-800 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-surface-800 rounded animate-pulse" />
              <div className="h-6 w-1/3 bg-surface-800 rounded animate-pulse" />
              <div className="h-12 w-full bg-surface-800 rounded-lg animate-pulse" />
              <div className="h-12 w-full bg-surface-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0D0F14] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-surface-900 border border-surface-800 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white font-mono">Product Not Found</h1>
          <p className="text-slate-400 text-sm">
            The requested automotive accessory may have been moved or updated.
          </p>
          <Link
            to="/catalogue"
            className="inline-block px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            Return to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    const res = addItem(product, quantity);
    if (res.success) {
      setAddedMessage(`Added to cart!`);
      setTimeout(() => setAddedMessage(''), 3000);
    } else {
      setAddedMessage(res.message || 'Could not add to cart.');
    }
  };

  const handleBuyNow = () => {
    const res = addItem(product, quantity);
    if (res.success) {
      navigate('/checkout');
    }
  };

  const validImages = (product.images || []).filter(
    (img) => img.url && img.url.trim().length > 0
  );

  const hasAnyImages = validImages.length > 0;
  const currentImage = validImages[activeImageIndex] || validImages[0];
  const isCurrentImgBroken = imageErrorMap[activeImageIndex];

  return (
    <div className="min-h-screen bg-[#0D0F14] text-slate-100">
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-10">
        {/* Top Product Navigation (Matches hero/header dark aesthetics) */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors group cursor-pointer"
            aria-label="Go back"
          >
            <HalfArrowIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.4} />
            <span>Back</span>
          </button>
          <Link
            to="/cart"
            className="relative p-2 rounded-full bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 transition-colors flex items-center justify-center"
            aria-label="View cart"
          >
            <i className="bi bi-bag text-sm" />
          </Link>
        </div>

        {/* Main Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: Product Image Card with Carousel Indicator Dots      */}
          {/* ========================================================= */}
          <div className="space-y-4">
            {/* Image Container with same dark tone as hero and header */}
            <div className="relative aspect-square sm:aspect-[4/3] rounded-xl bg-[#090B0E] border border-surface-800 flex items-center justify-center p-4 sm:p-8 overflow-hidden shadow-sm">
              {hasAnyImages && !isCurrentImgBroken ? (
                <img
                  src={currentImage.url}
                  onError={() =>
                    setImageErrorMap((prev) => ({ ...prev, [activeImageIndex]: true }))
                  }
                  alt={currentImage.altText || product.name}
                  className="w-full h-full object-contain object-center transition-all duration-300"
                />
              ) : (
                <ProductImagePlaceholder alt={product.name} />
              )}

              {/* Prev / Next Chevrons on Image */}
              {validImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-surface-700 backdrop-blur-xs"
                    aria-label="Previous image"
                  >
                    <i className="bi bi-chevron-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev + 1) % validImages.length)
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-surface-700 backdrop-blur-xs"
                    aria-label="Next image"
                  >
                    <i className="bi bi-chevron-right text-xs"></i>
                  </button>
                </>
              )}
            </div>

            {/* Carousel Indicator Dots */}
            {validImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {validImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`rounded-full transition-all ${
                      activeImageIndex === idx
                        ? 'w-5 h-2 bg-brand-500 rounded-full'
                        : 'w-2 h-2 bg-surface-700 hover:bg-surface-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Buy Box                                             */}
          {/* ========================================================= */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Row: Current Price + Compare Price + Sale Pill Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-base sm:text-lg text-slate-500 line-through font-normal">
                  {formatINR(product.compareAtPricePaisa)}
                </span>
              )}
              {product.compareAtPricePaisa && product.compareAtPricePaisa > product.pricePaisa && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-600 text-white tracking-wide">
                  Sale
                </span>
              )}
            </div>

            {/* Success message banner */}
            {addedMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                <span>{addedMessage}</span>
                <Link to="/cart" className="underline font-bold text-white">
                  View Cart
                </Link>
              </div>
            )}

            {/* Quantity & Stock Section */}
            <div className="pt-2">
              <label htmlFor="pdp-quantity" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantity
              </label>
              <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
                <div className="w-32 border border-surface-700 rounded-lg flex items-center justify-between px-3 py-1.5 bg-surface-900 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="text-slate-400 hover:text-white disabled:opacity-30 text-lg leading-none p-1 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id="pdp-quantity"
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.min(product.stockQuantity, Number(e.target.value))))
                    }
                    disabled={isOutOfStock}
                    className="w-10 text-center bg-transparent text-sm font-semibold text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity || isOutOfStock}
                    className="text-slate-400 hover:text-white disabled:opacity-30 text-lg leading-none p-1 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* In Stock status indicator */}
                <div>
                  {isOutOfStock ? (
                    <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      In Stock ({product.stockQuantity} available)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons (Add to Cart & Buy it now) */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-3 sm:py-3.5 rounded-lg border border-surface-700 bg-surface-900 hover:bg-surface-800 disabled:opacity-40 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Add to cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-3.5 sm:py-4 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-semibold text-sm transition-colors cursor-pointer shadow-sm"
              >
                Buy it now
              </button>
            </div>

            {/* Secure Checkout With & Payment Badges */}
            <div className="pt-3 border-t border-surface-800 space-y-2 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Secure Checkout With
              </p>
              
              <div className="flex items-center justify-center gap-3 flex-wrap pt-0.5">
                <div className="h-6 px-2.5 py-0.5 rounded border border-surface-700 bg-surface-900 flex items-center justify-center" title="Visa">
                  <span className="font-extrabold text-[11px] tracking-wider text-white italic">VISA</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-surface-700 bg-surface-900 flex items-center justify-center gap-0.5" title="Mastercard">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block opacity-90 -mr-1"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90"></span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-surface-700 bg-surface-900 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-200" title="Apple Pay">
                  <i className="bi bi-apple text-xs"></i>
                  <span>Pay</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-surface-700 bg-surface-900 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-200" title="Google Pay">
                  <span className="text-[#4285F4]">G</span>
                  <span>Pay</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-surface-700 bg-surface-900 flex items-center justify-center text-[10px] font-extrabold text-emerald-400" title="UPI">
                  <span>UPI</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-surface-700 bg-surface-900 flex items-center justify-center text-[11px] font-bold text-sky-400" title="PayPal">
                  <i className="bi bi-paypal text-xs"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Description & Specifications */}
        <div className="pt-6 border-t border-surface-800 space-y-0 text-sm w-full">
          {/* Accordion 1: Description */}
          <div className="border-b border-surface-800">
            <button
              type="button"
              onClick={() => toggleAccordion('description')}
              className="w-full py-4 flex items-center justify-between text-left font-semibold text-slate-200 hover:text-brand-400 transition-colors cursor-pointer"
            >
              <span className="text-base font-bold text-white">Description</span>
              <i className={`bi ${openAccordions.description ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-slate-400`}></i>
            </button>
            {openAccordions.description && (
              <div className="pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line text-left max-w-none">
                {product.description || product.shortDescription}
              </div>
            )}
          </div>

          {/* Accordion 2: Technical Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="border-b border-surface-800">
              <button
                type="button"
                onClick={() => toggleAccordion('specs')}
                className="w-full py-4 flex items-center justify-between text-left font-semibold text-slate-200 hover:text-brand-400 transition-colors cursor-pointer"
              >
                <span className="text-base font-bold text-white">Technical Specifications</span>
                <i className={`bi ${openAccordions.specs ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-slate-400`}></i>
              </button>
              {openAccordions.specs && (
                <div className="pb-6">
                  <table className="w-full text-left text-xs border border-surface-800 rounded-lg overflow-hidden bg-surface-900">
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-surface-900' : 'bg-surface-850'}>
                          <td className="px-4 py-2.5 text-slate-400 font-medium w-2/5 border-b border-surface-800">{spec.name}</td>
                          <td className="px-4 py-2.5 text-slate-100 font-bold border-b border-surface-800">{spec.value}</td>
                        </tr>
                      ))}
                      <tr className="bg-surface-900">
                        <td className="px-4 py-2.5 text-slate-400 font-medium border-b border-surface-800">Dimensions</td>
                        <td className="px-4 py-2.5 text-slate-100 font-bold border-b border-surface-800">{product.dimensionsCm} cm</td>
                      </tr>
                      <tr className="bg-surface-850">
                        <td className="px-4 py-2.5 text-slate-400 font-medium">Net Weight</td>
                        <td className="px-4 py-2.5 text-slate-100 font-bold">{product.weightGrams} grams</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Shipping & Returns */}
          <div className="border-b border-surface-800">
            <button
              type="button"
              onClick={() => toggleAccordion('shipping')}
              className="w-full py-4 flex items-center justify-between text-left font-semibold text-slate-200 hover:text-brand-400 transition-colors cursor-pointer"
            >
              <span className="text-base font-bold text-white">Shipping &amp; Warranty</span>
              <i className={`bi ${openAccordions.shipping ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-slate-400`}></i>
            </button>
            {openAccordions.shipping && (
              <div className="pb-6 space-y-2 text-xs text-slate-300 leading-relaxed text-left">
                <p>• <strong className="text-white">Free Express Courier:</strong> Across India on all orders over ₹4,999 via BlueDart &amp; Delhivery Express.</p>
                <p>• <strong className="text-white">Dispatch Guarantee:</strong> Dispatched within 24 hours from Pune logistics facility.</p>
                <p>• <strong className="text-white">Manufacturer Warranty:</strong> {product.warrantyMonths} months comprehensive warranty coverage.</p>
                <p>• <strong className="text-white">7-Day Returns:</strong> Rapid replacement guarantee for transit or manufacturing issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* Complementary Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-surface-800 space-y-5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
