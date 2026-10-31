import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository } from '../../infrastructure/repositories';
import { useCart } from '../../application/CartContext';
import { ProductCard } from '../../components/ui/ProductCard';

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
        // Force scroll to top after dynamic data is rendered
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
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4 pt-4">
            <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
        <p className="text-gray-500 text-sm">
          The requested automotive accessory may have been moved or updated.
        </p>
        <Link
          to="/catalogue"
          className="inline-block px-6 py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-xs uppercase tracking-wider"
        >
          Return to Catalogue
        </Link>
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

  const images = product.images.length > 0 ? product.images : [
    {
      id: 'default',
      productId: product.id,
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
      altText: product.name,
      sortOrder: 1,
      isPrimary: true,
    },
  ];

  const currentImage = images[activeImageIndex] || images[0];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-10">
        
        {/* Main Product Showcase (Matches KOVA Reference DTC Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: Product Image Card with Carousel Indicator Dots      */}
          {/* ========================================================= */}
          <div className="space-y-4">
            {/* Image Container with light neutral background */}
            <div className="relative aspect-square sm:aspect-[4/3] rounded-lg bg-[#F6F6F6] border border-gray-100 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
              <img
                src={currentImage.url}
                alt={currentImage.altText || product.name}
                className="w-full h-full object-contain object-center transition-all duration-300"
              />

              {/* Prev / Next Chevrons on Image */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center transition-all border border-gray-200"
                    aria-label="Previous image"
                  >
                    <i className="bi bi-chevron-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center transition-all border border-gray-200"
                    aria-label="Next image"
                  >
                    <i className="bi bi-chevron-right text-xs"></i>
                  </button>
                </>
              )}
            </div>

            {/* Carousel Indicator Dots (Under image as in reference) */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`rounded-full transition-all ${
                      activeImageIndex === idx
                        ? 'w-2.5 h-2.5 bg-gray-900'
                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Buy Box (Exact Typography & Actions as Reference)   */}
          {/* ========================================================= */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Row: Current Price + Compare Price + Sale Pill Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-base sm:text-lg text-gray-400 line-through font-normal">
                  {formatINR(product.compareAtPricePaisa)}
                </span>
              )}
              {product.compareAtPricePaisa && product.compareAtPricePaisa > product.pricePaisa && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EE81A2] text-white tracking-wide">
                  Sale
                </span>
              )}
            </div>

            {/* Success message banner */}
            {addedMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
                <span>{addedMessage}</span>
                <Link to="/cart" className="underline font-bold">
                  View Cart
                </Link>
              </div>
            )}

            {/* Quantity & Stock Section (Mobile: same line; Desktop: in stock just below quantity) */}
            <div className="pt-2">
              <label htmlFor="pdp-quantity" className="block text-xs font-semibold text-gray-800 mb-1.5">
                Quantity
              </label>
              <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
                <div className="w-32 border border-gray-300 rounded-lg flex items-center justify-between px-3 py-1.5 bg-white flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none p-1"
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
                    className="w-10 text-center bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity || isOutOfStock}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none p-1"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* In Stock status indicator */}
                <div>
                  {isOutOfStock ? (
                    <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
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
                className="w-full py-3 sm:py-3.5 rounded-lg border-2 border-gray-900 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:border-gray-200 text-gray-950 font-semibold text-sm transition-colors"
              >
                Add to cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-3.5 sm:py-4 rounded-lg bg-[#251E1B] hover:bg-black disabled:bg-gray-300 text-white font-semibold text-sm transition-colors"
              >
                Buy it now
              </button>
            </div>

            {/* Secure Checkout With & Payment Badges */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-center">
              <p className="text-xs text-gray-500 font-medium">
                Secure Checkout With
              </p>
              
              <div className="flex items-center justify-center gap-3 flex-wrap pt-0.5">
                {/* VISA */}
                <div className="h-6 px-2 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center" title="Visa">
                  <span className="font-extrabold text-[11px] tracking-wider text-[#1A1F71] italic">VISA</span>
                </div>

                {/* Mastercard */}
                <div className="h-6 px-2 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center gap-0.5" title="Mastercard">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block opacity-90 -mr-1"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90"></span>
                </div>

                {/* Apple Pay */}
                <div className="h-6 px-2 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-800" title="Apple Pay">
                  <i className="bi bi-apple text-xs"></i>
                  <span>Pay</span>
                </div>

                {/* Google Pay */}
                <div className="h-6 px-2 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center gap-1 text-[11px] font-bold text-gray-700" title="Google Pay">
                  <span className="text-[#4285F4]">G</span>
                  <span>Pay</span>
                </div>

                {/* UPI */}
                <div className="h-6 px-2 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center text-[10px] font-extrabold text-[#097939]" title="UPI">
                  <span>UPI</span>
                </div>

                {/* PayPal */}
                <div className="h-6 px-2 py-0.5 rounded border border-gray-200 bg-white flex items-center justify-center text-[11px] font-bold text-[#003087]" title="PayPal">
                  <i className="bi bi-paypal text-xs"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Description & Specifications (Same width as content, left-aligned) */}
        <div className="pt-6 border-t border-gray-200 space-y-0 text-sm w-full">
          {/* Accordion 1: Description */}
          <div className="border-b border-gray-200">
            <button
              type="button"
              onClick={() => toggleAccordion('description')}
              className="w-full py-4 flex items-center justify-between text-left font-semibold text-gray-900 hover:text-brand-600 transition-colors"
            >
              <span className="text-base font-bold">Description</span>
              <i className={`bi ${openAccordions.description ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-gray-500`}></i>
            </button>
            {openAccordions.description && (
              <div className="pb-6 text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line text-left max-w-none">
                {product.description || product.shortDescription}
              </div>
            )}
          </div>

          {/* Accordion 2: Technical Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="border-b border-gray-200">
              <button
                type="button"
                onClick={() => toggleAccordion('specs')}
                className="w-full py-4 flex items-center justify-between text-left font-semibold text-gray-900 hover:text-brand-600 transition-colors"
              >
                <span className="text-base font-bold">Technical Specifications</span>
                <i className={`bi ${openAccordions.specs ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-gray-500`}></i>
              </button>
              {openAccordions.specs && (
                <div className="pb-6">
                  <table className="w-full text-left text-xs border border-gray-100 rounded-lg overflow-hidden">
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-2.5 text-gray-500 font-medium w-2/5 border-b border-gray-100">{spec.name}</td>
                          <td className="px-4 py-2.5 text-gray-900 font-bold border-b border-gray-100">{spec.value}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 font-medium border-b border-gray-100">Dimensions</td>
                        <td className="px-4 py-2.5 text-gray-900 font-bold border-b border-gray-100">{product.dimensionsCm} cm</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-4 py-2.5 text-gray-500 font-medium">Net Weight</td>
                        <td className="px-4 py-2.5 text-gray-900 font-bold">{product.weightGrams} grams</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Shipping & Returns */}
          <div className="border-b border-gray-200">
            <button
              type="button"
              onClick={() => toggleAccordion('shipping')}
              className="w-full py-4 flex items-center justify-between text-left font-semibold text-gray-900 hover:text-brand-600 transition-colors"
            >
              <span className="text-base font-bold">Shipping &amp; Warranty</span>
              <i className={`bi ${openAccordions.shipping ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-gray-500`}></i>
            </button>
            {openAccordions.shipping && (
              <div className="pb-6 space-y-2 text-xs text-gray-600 leading-relaxed text-left">
                <p>• <strong>Free Express Courier:</strong> Across India on all orders over ₹4,999 via BlueDart &amp; Delhivery Express.</p>
                <p>• <strong>Dispatch Guarantee:</strong> Dispatched within 24 hours from Pune logistics facility.</p>
                <p>• <strong>Manufacturer Warranty:</strong> {product.warrantyMonths} months comprehensive warranty coverage.</p>
                <p>• <strong>7-Day Returns:</strong> Rapid replacement guarantee for transit or manufacturing issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* Complementary Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-gray-200 space-y-5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
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
