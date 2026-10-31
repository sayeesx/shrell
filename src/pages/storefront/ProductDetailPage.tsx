import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository } from '../../infrastructure/repositories';
import { useCart } from '../../application/CartContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { ShrellLoader } from '../../components/common/ShrellLoader';
export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, openCheckout } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedMessage, setAddedMessage] = useState<string>('');

  const productViews = [
    { id: 1, label: 'Front Fitment', tag: 'Primary' },
    { id: 2, label: 'Side Geometry', tag: '3/4 Angle' },
    { id: 3, label: 'Mounting Points', tag: 'OEM Spec' },
    { id: 4, label: 'Package Kit', tag: 'Complete' },
  ];

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
      <div className="min-h-[70vh] bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE] flex items-center justify-center p-6">
        <ShrellLoader size={84} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-[#130E10] border border-[#261619] rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-[#F1EEEE]">Product Not Found</h1>
          <p className="text-[#8E8587] text-sm">
            The requested automotive accessory may have been moved or updated.
          </p>
          <Link
            to="/catalogue"
            className="inline-block px-6 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-xs uppercase tracking-wider transition-colors"
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
      openCheckout();
    }
  };


  return (
    <div className="min-h-screen bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]">
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-10">
        {/* Top Product Navigation (SHRELL Home logo button only) */}
        <div className="flex items-center justify-between pb-3 border-b border-[#261619]">
          <div className="flex items-center">
            {/* SHRELL Home Logo Button */}
            <Link to="/" className="flex items-center group cursor-pointer" aria-label="SHRELL Home">
              <img
                src="/logos/shrell-logo-white.png"
                alt="SHRELL Automotive"
                className="h-[22px] w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          <Link
            to="/cart"
            className="relative p-2 rounded-full bg-[#130E10] hover:bg-[#1A1214] text-[#F1EEEE] border border-[#261619] transition-colors flex items-center justify-center cursor-pointer"
            aria-label="View cart"
          >
            <i className="bi bi-bag text-sm" />
          </Link>
        </div>

        {/* Main Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: Product Image Showcase (No box/border + 4 Cubes)   */}
          {/* ========================================================= */}
          <div className="space-y-4">
            {/* Main Product Image - Free-floating without box or border */}
            <div className="relative aspect-square sm:aspect-[4/3] flex items-center justify-center p-4 sm:p-8 select-none">
              <img
                src="/logos/shrell-full_white-text_black-logo.png"
                alt={`${product.name} - ${productViews[selectedImageIndex].label}`}
                className="w-56 sm:w-72 max-h-60 object-contain opacity-35 filter brightness-125 grayscale transition-all duration-300"
              />
              <div className="absolute bottom-2 left-2 pointer-events-none">
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 bg-[#0A0808]/80 px-2 py-0.5 rounded-full border border-[#261619]">
                  {productViews[selectedImageIndex].label}
                </span>
              </div>
            </div>

            {/* 4 Small Selectable Image Cubes */}
            <div className="flex items-center gap-3 pt-1">
              {productViews.map((view, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg transition-all flex items-center justify-center p-1.5 cursor-pointer select-none ${
                      isSelected
                        ? 'ring-2 ring-[#FF000E] bg-[#160D0F]'
                        : 'bg-[#100B0D] hover:bg-[#180E11] opacity-60 hover:opacity-100 border border-[#221215]'
                    }`}
                    aria-label={`View ${view.label}`}
                    title={view.label}
                  >
                    <img
                      src="/logos/shrell-full_white-text_black-logo.png"
                      alt={view.label}
                      className="w-full h-full object-contain opacity-40 brightness-125 grayscale"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Buy Box                                             */}
          {/* ========================================================= */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F1EEEE] tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Row: Current Price + Compare Price + Sale Pill Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-[#F1EEEE] tracking-tight">
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-base sm:text-lg text-[#7A7575] line-through font-normal">
                  {formatINR(product.compareAtPricePaisa)}
                </span>
              )}
              {product.compareAtPricePaisa && product.compareAtPricePaisa > product.pricePaisa && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B0000A] text-white tracking-wide">
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
                <div className="w-32 border border-[#261619] rounded-lg flex items-center justify-between px-3 py-1.5 bg-[#130E10] flex-shrink-0">
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
                className="w-full py-3 sm:py-3.5 rounded-lg border border-[#261619] bg-[#130E10] hover:bg-[#1A1214] disabled:opacity-40 text-[#F1EEEE] font-medium text-sm transition-colors cursor-pointer"
              >
                Add to cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-3.5 sm:py-4 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-40 text-white font-medium text-sm transition-colors cursor-pointer"
              >
                Buy it now
              </button>
            </div>

            {/* Secure Checkout With & Payment Badges */}
            <div className="pt-3 border-t border-[#261619] space-y-2 text-center">
              <p className="text-xs text-[#8E8587] font-medium">
                Secure Checkout With
              </p>
              
              <div className="flex items-center justify-center gap-3 flex-wrap pt-0.5">
                <div className="h-6 px-2.5 py-0.5 rounded border border-[#261619] bg-[#130E10] flex items-center justify-center" title="Visa">
                  <span className="font-bold text-[11px] tracking-wider text-[#F1EEEE] italic">VISA</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-[#261619] bg-[#130E10] flex items-center justify-center gap-0.5" title="Mastercard">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block opacity-90 -mr-1"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B0000A] inline-block opacity-90"></span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-[#261619] bg-[#130E10] flex items-center justify-center gap-1 text-[11px] font-medium text-[#F1EEEE]" title="Apple Pay">
                  <i className="bi bi-apple text-xs"></i>
                  <span>Pay</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-[#261619] bg-[#130E10] flex items-center justify-center gap-1 text-[11px] font-medium text-[#F1EEEE]" title="Google Pay">
                  <span className="text-[#FF000E]">G</span>
                  <span>Pay</span>
                </div>

                <div className="h-6 px-2.5 py-0.5 rounded border border-[#261619] bg-[#130E10] flex items-center justify-center text-[10px] font-bold text-[#F1EEEE]" title="UPI">
                  <span>UPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Description & Specifications */}
        <div className="pt-6 border-t border-[#261619] space-y-0 text-sm w-full">
          {/* Accordion 1: Description */}
          <div className="border-b border-[#261619]">
            <button
              type="button"
              onClick={() => toggleAccordion('description')}
              className="w-full py-4 flex items-center justify-between text-left font-medium text-[#F1EEEE] hover:text-[#FF000E] transition-colors cursor-pointer"
            >
              <span className="text-base font-semibold text-[#F1EEEE]">Description</span>
              <i className={`bi ${openAccordions.description ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-[#8E8587]`}></i>
            </button>
            {openAccordions.description && (
              <div className="pb-6 text-xs sm:text-sm text-[#D8D1D1] leading-relaxed whitespace-pre-line text-left max-w-none">
                {product.description || product.shortDescription}
              </div>
            )}
          </div>

          {/* Accordion 2: Technical Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="border-b border-[#261619]">
              <button
                type="button"
                onClick={() => toggleAccordion('specs')}
                className="w-full py-4 flex items-center justify-between text-left font-medium text-[#F1EEEE] hover:text-[#FF000E] transition-colors cursor-pointer"
              >
                <span className="text-base font-semibold text-[#F1EEEE]">Technical Specifications</span>
                <i className={`bi ${openAccordions.specs ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-[#8E8587]`}></i>
              </button>
              {openAccordions.specs && (
                <div className="pb-6">
                  <table className="w-full text-left text-xs border border-[#261619] rounded-lg overflow-hidden bg-[#130E10]">
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-[#130E10]' : 'bg-[#0E0A0B]'}>
                          <td className="px-4 py-2.5 text-[#8E8587] font-normal w-2/5 border-b border-[#261619]">{spec.name}</td>
                          <td className="px-4 py-2.5 text-[#F1EEEE] font-medium border-b border-[#261619]">{spec.value}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#130E10]">
                        <td className="px-4 py-2.5 text-[#8E8587] font-normal border-b border-[#261619]">Dimensions</td>
                        <td className="px-4 py-2.5 text-[#F1EEEE] font-medium border-b border-[#261619]">{product.dimensionsCm} cm</td>
                      </tr>
                      <tr className="bg-[#0E0A0B]">
                        <td className="px-4 py-2.5 text-[#8E8587] font-normal">Net Weight</td>
                        <td className="px-4 py-2.5 text-[#F1EEEE] font-medium">{product.weightGrams} grams</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Shipping & Returns */}
          <div className="border-b border-[#261619]">
            <button
              type="button"
              onClick={() => toggleAccordion('shipping')}
              className="w-full py-4 flex items-center justify-between text-left font-medium text-[#F1EEEE] hover:text-[#FF000E] transition-colors cursor-pointer"
            >
              <span className="text-base font-semibold text-[#F1EEEE]">Shipping &amp; Warranty</span>
              <i className={`bi ${openAccordions.shipping ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-[#8E8587]`}></i>
            </button>
            {openAccordions.shipping && (
              <div className="pb-6 space-y-2 text-xs text-[#D8D1D1] leading-relaxed text-left">
                <p>• <strong className="text-[#F1EEEE]">Free Express Courier:</strong> Across India on all orders over ₹4,999 via BlueDart &amp; Delhivery Express.</p>
                <p>• <strong className="text-[#F1EEEE]">Dispatch Guarantee:</strong> Dispatched within 24 hours from Pune logistics facility.</p>
                <p>• <strong className="text-[#F1EEEE]">Manufacturer Warranty:</strong> {product.warrantyMonths} months comprehensive warranty coverage.</p>
                <p>• <strong className="text-[#F1EEEE]">7-Day Returns:</strong> Rapid replacement guarantee for transit or manufacturing issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* Complementary Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-[#261619] space-y-5">
            <h2 className="text-xl font-bold text-[#F1EEEE] tracking-tight">
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
