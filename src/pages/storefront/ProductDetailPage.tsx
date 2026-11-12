import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, ProductReview, ProductRatingSummary } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { productRepository, reviewRepository } from '../../infrastructure/repositories';
import { useCart } from '../../application/CartContext';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { ProductDetailSkeleton } from '../../components/common/ShimmerSkeleton';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { trackProductViewed } from '../../infrastructure/analytics/posthog';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import { generateProductSchema, generateBreadcrumbSchema } from '../../infrastructure/seo/schemaGenerators';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
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

  // Reviews & Rating states
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [ratingSummary, setRatingSummary] = useState<ProductRatingSummary>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  const productViews = [
    { id: 1, label: 'Primary Angle' },
    { id: 2, label: 'Side Detail' },
    { id: 3, label: 'Mounting & Hardware' },
    { id: 4, label: 'Vehicle Fitment' },
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
          trackProductViewed(p);

          const [relatedRes, revList, rSummary] = await Promise.all([
            productRepository.getAll({ categorySlug: p.categoryId, limit: 4 }),
            reviewRepository.getByProductId(p.id),
            reviewRepository.getRatingSummary(p.id),
          ]);
          setRelatedProducts(relatedRes.products.filter((item) => item.id !== p.id));
          setReviews(revList);
          setRatingSummary(rSummary);
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
      <>
        <SEOHead
          title="Loading Equipment... | SHRELL"
          description="Loading automotive accessory details."
          noIndex={true}
        />
        <ProductDetailSkeleton />
      </>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
        <SEOHead
          title="Product Not Found | SHRELL Automotive"
          description="The requested automotive accessory may have been moved or updated."
          noIndex={true}
        />
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
      if (res.success) navigate('/cart');
    }, 400);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const author = reviewAuthor.trim() || user?.name || 'Verified Customer';
      await reviewRepository.addReview({
        productId: product.id,
        authorName: author,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        isVerifiedPurchase: true,
        customerId: user?.id,
      });

      const [updatedList, updatedSummary] = await Promise.all([
        reviewRepository.getByProductId(product.id),
        reviewRepository.getRatingSummary(product.id),
      ]);
      setReviews(updatedList);
      setRatingSummary(updatedSummary);
      setReviewSuccessMsg('Thank you! Your verified review and rating has been submitted.');
      setReviewTitle('');
      setReviewComment('');
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSuccessMsg('');
      }, 1600);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (score: number, size = 'text-xs') => {
    const stars = [];
    const rounded = Math.round(score * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (i <= rounded) {
        stars.push(<i key={i} className={`bi bi-star-fill text-amber-400 ${size}`} aria-hidden="true" />);
      } else if (i - 0.5 === rounded) {
        stars.push(<i key={i} className={`bi bi-star-half text-amber-400 ${size}`} aria-hidden="true" />);
      } else {
        stars.push(<i key={i} className={`bi bi-star text-slate-400 ${size}`} aria-hidden="true" />);
      }
    }
    return <div className="inline-flex items-center gap-0.5">{stars}</div>;
  };


  const productTitle = `${product.name} | Buy Online at SHRELL`;
  const productDescription = `Buy ${product.name} online at SHRELL Automotive. ${product.shortDescription || product.description.slice(0, 150)}. SKU: ${product.sku}. ₹${(product.pricePaisa / 100).toFixed(0)} with express delivery across India.`;
  const productImageUrl = product.images?.[0]?.url || '/shrell-opengraph.png';
  const categoryTitle = product.categoryName || 'Equipment Catalogue';
  const categoryPath = product.categoryId ? `/catalogue?category=${product.categoryId}` : '/catalogue';

  const productSchema = generateProductSchema(
    product,
    ratingSummary.totalReviews > 0 ? ratingSummary : undefined
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: categoryTitle, url: categoryPath },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <SEOHead
        title={productTitle}
        description={productDescription}
        canonicalPath={`/product/${product.slug}`}
        ogType="product"
        ogImage={productImageUrl}
        ogImageAlt={`${product.name} - SHRELL Automotive`}
        twitterCard="summary_large_image"
        structuredData={[productSchema, breadcrumbSchema]}
      />

      {/* Semantic Crawlable Breadcrumbs with Real Links (hidden visually, preserved for SEO & screen readers) */}
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to={categoryPath}>{categoryTitle}</Link>
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-36 sm:pb-16 space-y-6 sm:space-y-8">
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
                    alt={`${product.name} - ${productViews[selectedImageIndex]?.label || 'Primary View'}`}
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    width="600"
                    height="450"
                    className="w-full h-full max-h-72 object-contain transition-all duration-300"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className={`w-56 sm:w-72 max-h-60 flex items-center justify-center ${isDark ? 'opacity-60' : 'opacity-85'}`}>
                    <img
                      src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
                      alt={`${product.name} - ${productViews[selectedImageIndex]?.label || 'Primary View'}`}
                      fetchPriority="high"
                      width="320"
                      height="120"
                      className="w-full h-full object-contain transition-all duration-300"
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
                    aria-label={`View ${product.name} - ${view.label}`}
                    title={view.label}
                  >
                    {isThumbReal ? (
                      <img src={thumbClean} alt={`${product.name} - ${view.label} Thumbnail`} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    ) : (
                      <img src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'} alt={`${product.name} - ${view.label} Thumbnail`} className={`w-full h-full object-contain ${isDark ? 'opacity-60' : 'opacity-85'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Buy Box */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title & Rating */}
            <div className="space-y-1.5">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight leading-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                {product.name}
              </h1>

              {/* Dynamic Rating Link */}
              <div className="flex items-center gap-2 text-xs pt-0.5">
                {renderStars(ratingSummary.averageRating, 'text-sm')}
                <span className={`font-bold font-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                  {ratingSummary.averageRating.toFixed(1)}
                </span>
                <a
                  href="#reviews-section"
                  className={`underline hover:text-[#FF000E] transition-colors ${
                    isDark ? 'text-slate-400' : 'text-[#5C5456]'
                  }`}
                >
                  ({ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? 'review' : 'reviews'})
                </a>
                <span className="text-slate-400">•</span>
                <span className={`text-[11px] font-medium inline-flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <i className="bi bi-patch-check-fill" />
                  Verified Overland Fitment
                </span>
              </div>
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
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Free Express Courier:</strong> Across India on all orders over ₹300 via BlueDart &amp; Delhivery Express.</p>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Dispatch Guarantee:</strong> Dispatched within 24 hours from Pune logistics facility.</p>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Manufacturer Warranty:</strong> {product.warrantyMonths} months comprehensive warranty coverage.</p>
                <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>7-Day Returns:</strong> Rapid replacement guarantee for transit or manufacturing issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* REVIEWS & RATINGS SECTION                                 */}
        {/* ========================================================= */}
        <section id="reviews-section" className={`pt-8 border-t space-y-6 scroll-mt-6 ${
          isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                Customer Reviews &amp; Ratings
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                Verified feedback from Indian automotive expeditioners and touring enthusiasts
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setReviewRating(5);
                setReviewHoverRating(0);
                setReviewAuthor(user?.name || '');
                setReviewTitle('');
                setReviewComment('');
                setIsReviewModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <i className="bi bi-pencil-square" />
              <span>Write a Review</span>
            </button>
          </div>

          {/* Rating Summary Breakdown Box */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${
            isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Overall Score */}
              <div className="md:col-span-4 text-center md:text-left md:border-r border-black/10 dark:border-white/10 md:pr-6 space-y-2">
                <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-tight ${
                  isDark ? 'text-white' : 'text-[#140E10]'
                }`}>
                  {ratingSummary.averageRating.toFixed(1)}
                  <span className="text-xl font-normal text-slate-400"> / 5.0</span>
                </div>
                <div>{renderStars(ratingSummary.averageRating, 'text-lg')}</div>
                <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                  Based on {ratingSummary.totalReviews} verified {ratingSummary.totalReviews === 1 ? 'rating' : 'ratings'}
                </div>
              </div>

              {/* Star Breakdown Bars */}
              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingSummary.ratingBreakdown[star] || 0;
                  const percent = ratingSummary.totalReviews > 0
                    ? Math.round((count / ratingSummary.totalReviews) * 100)
                    : 0;

                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-mono flex items-center gap-1 shrink-0 font-medium">
                        <span>{star}</span>
                        <i className="bi bi-star-fill text-amber-400 text-[10px]" />
                      </span>
                      <div className="flex-1 bg-black/10 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-mono text-[11px] text-slate-400 shrink-0">
                        {count} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-white border-[#E0DBD2]'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  <i className="bi bi-chat-heart text-xl" />
                </div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                  No Customer Reviews Yet
                </h3>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                  Be the first to review this {product.name} and help fellow Indian overland enthusiasts.
                </p>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Rate &amp; Review First
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`rounded-2xl border p-5 space-y-2.5 transition-colors ${
                      isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-white border-[#E0DBD2]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {rev.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                              {rev.authorName}
                            </span>
                            {rev.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                                <i className="bi bi-patch-check-fill" /> Verified Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div>{renderStars(rev.rating, 'text-xs')}</div>
                    </div>

                    {rev.title && (
                      <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {rev.title}
                      </h4>
                    )}

                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* REVIEW & RATING SUBMISSION MODAL */}
        {isReviewModalOpen && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
          >
            {/* Dedicated Fullscreen Frosted Backdrop Layer (zero background bleed) */}
            <div
              className="fixed inset-0 modal-backdrop-solid"
              onClick={() => setIsReviewModalOpen(false)}
              aria-hidden="true"
            />

            {/* Centered Modal Card */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col p-6 space-y-4 my-auto ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                    Write a Customer Review
                  </h3>
                  <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {product.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  aria-label="Close review dialog"
                >
                  <i className="bi bi-x-lg text-xs" />
                </button>
              </div>

              {reviewSuccessMsg ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-2xl">
                    <i className="bi bi-check-lg" />
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {reviewSuccessMsg}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-mono">
                  {/* Star Rating Selector */}
                  <div>
                    <label className={`block uppercase font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Overall Rating *
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (reviewHoverRating || reviewRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setReviewHoverRating(star)}
                            onMouseLeave={() => setReviewHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                            className="text-2xl transition-transform hover:scale-110 cursor-pointer p-0.5"
                            aria-label={`${star} star rating`}
                          >
                            <i className={`bi ${active ? 'bi-star-fill text-amber-400' : 'bi-star text-slate-500'}`} />
                          </button>
                        );
                      })}
                      <span className="text-xs font-semibold text-amber-400 ml-2">
                        {reviewRating === 5 && '5 Stars - Outstanding'}
                        {reviewRating === 4 && '4 Stars - Very Good'}
                        {reviewRating === 3 && '3 Stars - Average'}
                        {reviewRating === 2 && '2 Stars - Needs Improvement'}
                        {reviewRating === 1 && '1 Star - Poor'}
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Name */}
                  <div>
                    <label className={`block uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>

                  {/* Review Headline */}
                  <div>
                    <label className={`block uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Review Headline (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Perfect fit on Scorpio-N, rugged build quality"
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>

                  {/* Detailed Comment */}
                  <div>
                    <label className={`block uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Detailed Feedback *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe ease of installation, finish quality, highway performance, fitment precision..."
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>

                  {/* Actions */}
                  <div className={`pt-3 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-5 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

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
