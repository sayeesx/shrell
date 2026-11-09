import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository } from '../../infrastructure/repositories';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, openCheckout } = useCart();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedMessage, setAddedMessage] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const productViews = [
    { id: 1, label: '' },
    { id: 2, label: '' },
    { id: 3, label: '' },
    { id: 4, label: '' },
  ];

  // Accordion open states - Shipping & Warranty expanded by default on all screens
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    specs: false,
    shipping: true,
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
        finishPageLoad();
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
  }, [slug, finishPageLoad]);

  if (loading) {
    return (
      <div className={`min-h-[70vh] flex items-center justify-center p-6 ${isDark ? 'bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
        <ShrellLoader size={84} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
        <div className={`max-w-md w-full text-center space-y-4 rounded-xl p-8 border ${isDark ? 'bg-[#130E10] border-[#261619]' : 'bg-white border-[#E0DBD2]'}`}>
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>Product Not Found</h1>
          <p className={`text-sm ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            The requested automotive accessory may have been moved or updated.
          </p>
          <Link to="/catalogue" className="inline-block px-6 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-xs uppercase tracking-wider transition-colors">
            Return to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    setTimeout(() => {
      const res = addItem(product, quantity);
      setIsAddingToCart(false);
      if (res.success) {
        setAddedMessage('Added to cart!');
        setTimeout(() => setAddedMessage(''), 3000);
      } else {
        setAddedMessage(res.message || 'Could not add to cart.');
      }
    }, 600);
  };

  const handleBuyNow = () => {
    if (isBuyingNow) return;
    setIsBuyingNow(true);
    setTimeout(() => {
      const res = addItem(product, quantity);
      setIsBuyingNow(false);
      if (res.success) openCheckout();
    }, 600);
  };


  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-36 sm:pb-16 space-y-8 sm:space-y-10">
        {/* Minimal Back Navigation (No topbar with cart) */}
        <div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className={`inline-flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'text-[#8E8587] hover:text-[#F1EEEE]' : 'text-[#5C5456] hover:text-[#140E10]'
            }`}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left text-sm" aria-hidden="true" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: Product Image Showcase (No box/border + 4 Cubes)   */}
          {/* ========================================================= */}
          <div className="space-y-4">
            {/* Main Product Image - Free-floating without box or border */}
            <div className="relative aspect-square sm:aspect-[4/3] flex items-center justify-center p-4 sm:p-8 select-none">
              {(() => {
                const rawUrl = product.images?.[selectedImageIndex]?.url || product.images?.[0]?.url;
                let cleanUrl = rawUrl?.trim() || '';
                if (cleanUrl.startsWith('http://res.cloudinary.com/')) {
                  cleanUrl = cleanUrl.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/');
                }
                const isReal = Boolean(cleanUrl && !imageError && !cleanUrl.includes('shrell-full_white-text_black-logo.png'));
                return isReal ? (
                  <img
                    src={cleanUrl}
                    alt={`${product.name} - ${productViews[selectedImageIndex]?.label || 'Product View'}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full max-h-72 object-contain transition-all duration-300"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className={`w-56 sm:w-72 max-h-60 flex items-center justify-center ${isDark ? 'opacity-40' : 'opacity-20'}`}>
                    <img
                      src="/logos/shrell-full_white-text_black-logo.png"
                      alt={`${product.name} - ${productViews[selectedImageIndex]?.label || 'Product View'}`}
                      className={`w-full h-full object-contain transition-all duration-300 ${isDark ? 'grayscale brightness-125' : 'grayscale brightness-50'}`}
                    />
                  </div>
                );
              })()}
            </div>

            {/* 4 Small Selectable Image Cubes */}
            <div className="flex items-center gap-3 pt-1">
              {productViews.map((view, idx) => {
                const isSelected = selectedImageIndex === idx;
                const thumbRaw = product.images?.[idx]?.url || product.images?.[0]?.url;
                let thumbClean = thumbRaw?.trim() || '';
                if (thumbClean.startsWith('http://res.cloudinary.com/')) {
                  thumbClean = thumbClean.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/');
                }
                const isThumbReal = Boolean(thumbClean && !thumbClean.includes('shrell-full_white-text_black-logo.png'));

                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => { setSelectedImageIndex(idx); setImageError(false); }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg transition-all flex items-center justify-center p-1.5 cursor-pointer select-none ${
                      isSelected
                        ? 'ring-2 ring-[#FF000E] ' + (isDark ? 'bg-[#160D0F]' : 'bg-[#FFE0E2]')
                        : isDark
                          ? 'bg-[#100B0D] hover:bg-[#180E11] opacity-60 hover:opacity-100 border border-[#221215]'
                          : 'bg-[#F5F3EE] hover:bg-[#EDE9E1] opacity-70 hover:opacity-100 border border-[#E0DBD2]'
                    }`}
                    aria-label={`View ${view.label}`}
                    title={view.label}
                  >
                    {isThumbReal ? (
                      <img src={thumbClean} alt={view.label} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    ) : (
                      <img src="/logos/shrell-full_white-text_black-logo.png" alt={view.label} className={`w-full h-full object-contain ${isDark ? 'opacity-40 brightness-125 grayscale' : 'opacity-20 grayscale'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Buy Box */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight leading-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                {product.name}
              </h1>
            </div>

            {/* Price Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-2xl sm:text-3xl font-bold font-tight tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                {formatINR(product.pricePaisa)}
              </span>
              {product.compareAtPricePaisa && (
                <span className="text-base sm:text-lg text-[#7A7575] line-through font-normal font-tight">
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
                <Link to="/cart" className="underline font-bold text-white">View Cart</Link>
              </div>
            )}

            {/* Quantity & Stock Section */}
            <div className="pt-2">
              <label htmlFor="pdp-quantity" className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
                Quantity
              </label>
              <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
                <div className={`w-32 border rounded-lg flex items-center justify-between px-3 py-1.5 flex-shrink-0 ${isDark ? 'border-[#261619] bg-[#130E10]' : 'border-[#E0DBD2] bg-[#F5F3EE]'}`}>
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1 || isOutOfStock}
                    className={`text-lg leading-none p-1 cursor-pointer disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white' : 'text-[#5C5456] hover:text-[#140E10]'}`} aria-label="Decrease quantity">−</button>
                  <input id="pdp-quantity" type="number" min="1" max={product.stockQuantity} value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stockQuantity, Number(e.target.value))))}
                    disabled={isOutOfStock}
                    className={`w-10 text-center bg-transparent text-sm font-semibold focus:outline-none ${isDark ? 'text-white' : 'text-[#140E10]'}`}
                  />
                  <button type="button" onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))} disabled={quantity >= product.stockQuantity || isOutOfStock}
                    className={`text-lg leading-none p-1 cursor-pointer disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white' : 'text-[#5C5456] hover:text-[#140E10]'}`} aria-label="Increase quantity">+</button>
                </div>
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

            {/* Action Buttons with loaders */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className={`relative w-full py-3 sm:py-3.5 rounded-lg border disabled:opacity-40 font-medium text-sm transition-colors cursor-pointer flex items-center justify-center overflow-hidden ${isDark ? 'border-[#261619] bg-[#130E10] hover:bg-[#1A1214] text-[#F1EEEE]' : 'border-[#E0DBD2] bg-[#F5F3EE] hover:bg-[#EDE9E1] text-[#140E10]'}`}
              >
                <span className={`transition-all duration-300 ${isAddingToCart ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                  Add to cart
                </span>
                {isAddingToCart && (
                  <div className="absolute">
                    <ShrellLoader size={18} />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || isBuyingNow}
                className="relative w-full py-3.5 sm:py-4 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-40 text-white font-medium text-sm transition-colors cursor-pointer flex items-center justify-center overflow-hidden"
              >
                <span className={`transition-all duration-300 ${isBuyingNow ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                  Buy it now
                </span>
                {isBuyingNow && (
                  <div className="absolute">
                    <ShrellLoader size={18} white />
                  </div>
                )}
              </button>
            </div>

            {/* Secure Checkout badges */}
            <div className={`pt-3 border-t space-y-2 text-center ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
              <p className={`text-xs font-medium ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>Secure Checkout With</p>
              <div className="flex items-center justify-center gap-3 flex-wrap pt-0.5">
                <div title="Visa" className={`h-6 px-2.5 py-0.5 rounded border flex items-center justify-center ${isDark ? 'border-[#261619] bg-[#130E10]' : 'border-[#E0DBD2] bg-[#F5F3EE]'}`}>
                  <span className={`font-bold text-[11px] tracking-wider italic ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>VISA</span>
                </div>
                <div title="Mastercard" className={`h-6 px-2.5 py-0.5 rounded border flex items-center justify-center gap-0.5 ${isDark ? 'border-[#261619] bg-[#130E10]' : 'border-[#E0DBD2] bg-[#F5F3EE]'}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block opacity-90 -mr-1"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B0000A] inline-block opacity-90"></span>
                </div>
                <div title="Apple Pay" className={`h-6 px-2.5 py-0.5 rounded border flex items-center justify-center gap-1 text-[11px] font-medium ${isDark ? 'border-[#261619] bg-[#130E10] text-[#F1EEEE]' : 'border-[#E0DBD2] bg-[#F5F3EE] text-[#140E10]'}`}>
                  <i className="bi bi-apple text-xs"></i><span>Pay</span>
                </div>
                <div title="Google Pay" className={`h-6 px-2.5 py-0.5 rounded border flex items-center justify-center gap-1 text-[11px] font-medium ${isDark ? 'border-[#261619] bg-[#130E10] text-[#F1EEEE]' : 'border-[#E0DBD2] bg-[#F5F3EE] text-[#140E10]'}`}>
                  <span className="text-[#FF000E]">G</span><span>Pay</span>
                </div>
                <div title="UPI" className={`h-6 px-2.5 py-0.5 rounded border flex items-center justify-center text-[10px] font-bold ${isDark ? 'border-[#261619] bg-[#130E10] text-[#F1EEEE]' : 'border-[#E0DBD2] bg-[#F5F3EE] text-[#140E10]'}`}>
                  <span>UPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Description & Specifications */}
        <div className={`pt-6 border-t space-y-0 text-sm w-full ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
          {/* Accordion 1: Description */}
          <div className={`border-b ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
            <button type="button" onClick={() => toggleAccordion('description')}
              className={`w-full py-4 flex items-center justify-between text-left font-medium hover:text-[#FF000E] transition-colors cursor-pointer ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>Description</span>
              <i className={`bi ${openAccordions.description ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}></i>
            </button>
            {openAccordions.description && (
              <div className={`pb-6 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-left max-w-none ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
                {product.description || product.shortDescription}
              </div>
            )}
          </div>

          {/* Accordion 2: Technical Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className={`border-b ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
              <button type="button" onClick={() => toggleAccordion('specs')}
                className={`w-full py-4 flex items-center justify-between text-left font-medium hover:text-[#FF000E] transition-colors cursor-pointer ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                <span className={`text-base font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>Technical Specifications</span>
                <i className={`bi ${openAccordions.specs ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}></i>
              </button>
              {openAccordions.specs && (
                <div className="pb-6">
                  <table className={`w-full text-left text-xs border rounded-lg overflow-hidden ${isDark ? 'border-[#261619] bg-[#130E10]' : 'border-[#E0DBD2] bg-[#F5F3EE]'}`}>
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className={isDark ? (i % 2 === 0 ? 'bg-[#130E10]' : 'bg-[#0E0A0B]') : (i % 2 === 0 ? 'bg-[#F5F3EE]' : 'bg-white')}>
                          <td className={`px-4 py-2.5 font-normal w-2/5 border-b ${isDark ? 'text-[#8E8587] border-[#261619]' : 'text-[#5C5456] border-[#E0DBD2]'}`}>{spec.name}</td>
                          <td className={`px-4 py-2.5 font-medium border-b ${isDark ? 'text-[#F1EEEE] border-[#261619]' : 'text-[#140E10] border-[#E0DBD2]'}`}>{spec.value}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'bg-[#130E10]' : 'bg-[#F5F3EE]'}>
                        <td className={`px-4 py-2.5 font-normal border-b ${isDark ? 'text-[#8E8587] border-[#261619]' : 'text-[#5C5456] border-[#E0DBD2]'}`}>Dimensions</td>
                        <td className={`px-4 py-2.5 font-medium border-b ${isDark ? 'text-[#F1EEEE] border-[#261619]' : 'text-[#140E10] border-[#E0DBD2]'}`}>{product.dimensionsCm} cm</td>
                      </tr>
                      <tr className={isDark ? 'bg-[#0E0A0B]' : 'bg-white'}>
                        <td className={`px-4 py-2.5 font-normal ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>Net Weight</td>
                        <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>{product.weightGrams} grams</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Shipping & Returns */}
          <div className={`border-b ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
            <button type="button" onClick={() => toggleAccordion('shipping')}
              className={`w-full py-4 flex items-center justify-between text-left font-medium hover:text-[#FF000E] transition-colors cursor-pointer ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>Shipping &amp; Warranty</span>
              <i className={`bi ${openAccordions.shipping ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}></i>
            </button>
            {openAccordions.shipping && (
              <div className={`pb-6 space-y-2 text-xs leading-relaxed text-left ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Free Express Courier:</strong> Across India on all orders over ₹4,999 via BlueDart &amp; Delhivery Express.</p>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Dispatch Guarantee:</strong> Dispatched within 24 hours from Pune logistics facility.</p>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Manufacturer Warranty:</strong> {product.warrantyMonths} months comprehensive warranty coverage.</p>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>7-Day Returns:</strong> Rapid replacement guarantee for transit or manufacturing issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* Complementary Products */}
        {relatedProducts.length > 0 && (
          <div className={`pt-10 border-t space-y-5 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
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
