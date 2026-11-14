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
import { PaymentMethodIcons } from '../../components/common/PaymentMethodIcons';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { ProductDetailSkeleton } from '../../components/common/ShimmerSkeleton';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { trackProductViewed } from '../../infrastructure/analytics/posthog';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import { generateProductSchema, generateBreadcrumbSchema } from '../../infrastructure/seo/schemaGenerators';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, settings } = useCart();
  const { user } = useAuth();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedMessage, setAddedMessage] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
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

  // Review Modal Stepper State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStep, setReviewStep] = useState<1 | 2 | 3>(1);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Restock Notification States (for Out-of-Stock items)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyContact, setNotifyContact] = useState('');
  const [isNotifying, setIsNotifying] = useState(false);
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState<string | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifyWhatsAppLink, setNotifyWhatsAppLink] = useState<string | null>(null);

  useBodyScrollLock(isReviewModalOpen || isNotifyModalOpen);

  useEffect(() => {
    if (!isReviewModalOpen && !isNotifyModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsReviewModalOpen(false);
        setIsNotifyModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isReviewModalOpen, isNotifyModalOpen]);

  const productViews = [
    { id: 1, label: 'Primary Angle' },
    { id: 2, label: 'Side Detail' },
    { id: 3, label: 'Mounting & Hardware' },
    { id: 4, label: 'Vehicle Fitment' },
  ];

  // Accordion open states - Technical Specifications & Shipping & Warranty start collapsed
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
        let p = await productRepository.getBySlug(slug);
        if (!p) {
          p = await productRepository.getById(slug);
        }
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
      const res = addItem(product, quantity, { allowOutOfStockWaitlist: true });
      setIsAddingToCart(false);
      if (res.success) {
        setAddedMessage(res.message || 'Added to cart!');
        setTimeout(() => setAddedMessage(''), 4000);
      } else {
        setAddedMessage(res.message || 'Could not add to cart.');
      }
    }, 600);
  };

  const handleBuyNow = () => {
    if (isOutOfStock || isBuyingNow) return;
    setIsBuyingNow(true);
    setTimeout(() => {
      const res = addItem(product, quantity);
      setIsBuyingNow(false);
      if (res.success) navigate('/cart');
    }, 400);
  };

  const handleNotifyWhenAvailable = () => {
    if (!product) return;

    if (user && (user.email || user.phone)) {
      setIsNotifying(true);
      const contactVal = (user.email || user.phone || user.name || '').trim();
      const newLead = {
        id: `lead-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        contact: contactVal,
        userName: user.name || 'Valued Customer',
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      try {
        const stored = JSON.parse(localStorage.getItem('shrell_restock_requests') || '[]');
        localStorage.setItem('shrell_restock_requests', JSON.stringify([newLead, ...stored]));
      } catch (_) {}

      const waMsg = `Hello SHRELL Operations, please notify me when *${product.name}* (SKU: ${product.sku}) is back in stock. My registered contact is: ${contactVal}`;
      const waUrl = whatsAppService.generateLink(waMsg);
      setNotifyWhatsAppLink(waUrl);

      setTimeout(() => {
        setIsNotifying(false);
        setNotifySuccessMsg(`Request registered! We will notify you at ${contactVal} when on order.`);
      }, 400);
    } else {
      setNotifyError(null);
      setNotifySuccessMsg(null);
      setNotifyContact('');
      setIsNotifyModalOpen(true);
    }
  };

  const handleSubmitGuestNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const trimmed = notifyContact.trim();
    if (!trimmed || trimmed.length < 5) {
      setNotifyError('Please enter a valid phone number or email address.');
      return;
    }

    setIsSubmittingNotify(true);
    setNotifyError(null);

    const newLead = {
      id: `lead-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      contact: trimmed,
      userName: 'Guest Customer',
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = JSON.parse(localStorage.getItem('shrell_restock_requests') || '[]');
      localStorage.setItem('shrell_restock_requests', JSON.stringify([newLead, ...stored]));
    } catch (_) {}

    const waMsg = `Hello SHRELL Operations, please notify me when *${product.name}* (SKU: ${product.sku}) is back in stock. My contact is: ${trimmed}`;
    const waUrl = whatsAppService.generateLink(waMsg);
    setNotifyWhatsAppLink(waUrl);

    setTimeout(() => {
      setIsSubmittingNotify(false);
      setNotifySuccessMsg(`Request registered! We will notify you at ${trimmed} when on order.`);
    }, 400);
  };

  const handleShareProduct = async () => {
    if (!product) return;
    const shareUrl = `${window.location.origin}/product/${product.slug}`;
    const shareTitle = `${product.name} | SHRELL Automotive`;
    const shareText = product.shortDescription || `Check out ${product.name} at SHRELL Automotive`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2500);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2500);
    }
  };

  const openReviewModal = () => {
    setReviewStep(1);
    setReviewRating(5);
    setReviewHoverRating(0);
    const isInternalRole =
      user?.role === 'admin' ||
      !user?.name ||
      user.name === 'Valued Customer' ||
      /shrell|operator|operations|admin|director/i.test(user.name);
    const profileName = isInternalRole ? '' : user.name.trim();
    setReviewAuthor(profileName);
    setReviewComment('');
    setReviewSuccessMsg('');
    setIsReviewModalOpen(true);
  };

  const submitCustomerReview = async (skipFeedback = false) => {
    if (!product || isSubmittingReview) return;
    const trimmedComment = reviewComment.trim();
    if (!skipFeedback && !trimmedComment) return;

    setIsSubmittingReview(true);
    try {
      let author = reviewAuthor.trim();
      if (!author || /shrell\s*(operator|operations|admin|director)|operator/i.test(author)) {
        author = 'Anonymous';
      }
      await reviewRepository.addReview({
        productId: product.id,
        authorName: author,
        rating: reviewRating,
        comment: skipFeedback ? `Rated ${reviewRating}/5 stars` : trimmedComment,
        isVerifiedPurchase: true,
        customerId: user?.id,
      });

      const [updatedList, updatedSummary] = await Promise.all([
        reviewRepository.getByProductId(product.id),
        reviewRepository.getRatingSummary(product.id),
      ]);
      setReviews(updatedList);
      setRatingSummary(updatedSummary);
      setReviewSuccessMsg('Thank you! Your review has been submitted.');
      setReviewComment('');
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCustomerReview(false);
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
  const firstProductImage = product.images?.find((img) => img?.url?.trim())?.url?.trim();
  const productImageUrl = firstProductImage || settings?.ogImageUrl || '/shrell-opengraph.png';
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
            {/* Title, Share Button & Rating */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight leading-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                  {product.name}
                </h1>
                <button
                  type="button"
                  onClick={handleShareProduct}
                  aria-label={`Share ${product.name}`}
                  title="Share product link"
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF000E] ${
                    shareStatus !== 'idle'
                      ? isDark
                        ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                        : 'border-emerald-600/50 bg-emerald-50 text-emerald-700'
                      : isDark
                        ? 'border-[#261619] bg-[#130E10] hover:bg-[#1E1417] text-[#F1EEEE]'
                        : 'border-[#E0DBD2] bg-[#F5F3EE] hover:bg-[#EDE9E1] text-[#140E10]'
                  }`}
                >
                  <i
                    className={`bi ${shareStatus !== 'idle' ? 'bi-check2' : 'bi-share'} text-xs`}
                    aria-hidden="true"
                  />
                  <span>
                    {shareStatus === 'copied' ? 'Link Copied' : shareStatus === 'shared' ? 'Shared' : 'Share'}
                  </span>
                </button>
              </div>

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

            {/* Out of Stock Restock Notification Banner (no background or shadow on image) */}
            {isOutOfStock && (
              <div
                role="status"
                className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3.5 ${
                  isDark
                    ? 'bg-[#0A0A0A] border-[#261619] text-[#F1EEEE]'
                    : 'bg-[#FAF8F4] border-[#E0DBD2] text-[#140E10]'
                }`}
              >
                <img
                  src="/images/Tired Worker in a Busy Warehouse_converted.avif"
                  alt="Warehouse team preparing restock"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0 bg-transparent border-0 shadow-none"
                  style={{ boxShadow: 'none', background: 'transparent' }}
                />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold tracking-tight text-[#FF000E]">
                    We&apos;re extremely sorry!
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-[#3A3030]'}`}>
                    This item is currently out of stock. Add it to your cart and once we restock, we&apos;ll send you a message right away.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons with loaders */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
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

              {isOutOfStock ? (
                <button
                  type="button"
                  onClick={handleNotifyWhenAvailable}
                  disabled={isNotifying}
                  className="relative w-full py-3.5 sm:py-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center overflow-hidden cursor-pointer shadow-md active:scale-98 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50"
                >
                  {isNotifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Registering Alert...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-bell-fill text-sm" />
                      <span>Notify When on Order</span>
                    </div>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isBuyingNow}
                  className="relative w-full py-3.5 sm:py-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center overflow-hidden bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-40 text-white cursor-pointer"
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
              )}

              {notifySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <i className="bi bi-check-circle-fill text-sm shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{notifySuccessMsg}</span>
                  </div>
                  {notifyWhatsAppLink && (
                    <a
                      href={notifyWhatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                    >
                      <i className="bi bi-whatsapp text-xs" />
                      <span>Ping Admin on WhatsApp</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Secure Checkout badges */}
            <div className={`pt-3 border-t space-y-2 text-center ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
              <p className={`text-xs font-medium ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>Secure Checkout With</p>
              <div className="flex items-center justify-center pt-0.5">
                <PaymentMethodIcons />
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
          {(() => {
            const techSpecs = (product.specifications || []).filter(
              (s) => s.group !== 'Shipping & Warranty'
            );
            const hasTechSpecs =
              product.showTechnicalSpecs !== false &&
              (techSpecs.length > 0 || Boolean(product.dimensionsCm) || Boolean(product.weightGrams));

            if (!hasTechSpecs) return null;

            return (
              <div className={`border-b ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className={`w-full py-4 flex items-center justify-between text-left font-medium hover:text-[#FF000E] transition-colors cursor-pointer ${
                    isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'
                  }`}
                >
                  <span className={`text-base font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                    Technical Specifications
                  </span>
                  <i
                    className={`bi ${openAccordions.specs ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs ${
                      isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'
                    }`}
                  />
                </button>
                {openAccordions.specs && (
                  <div className="pb-6">
                    <table
                      className={`w-full text-left text-xs border rounded-lg overflow-hidden ${
                        isDark ? 'border-[#261619] bg-[#130E10]' : 'border-[#E0DBD2] bg-[#F5F3EE]'
                      }`}
                    >
                      <tbody>
                        {techSpecs.map((spec, i) => (
                          <tr
                            key={i}
                            className={
                              isDark
                                ? i % 2 === 0
                                  ? 'bg-[#130E10]'
                                  : 'bg-[#0E0A0B]'
                                : i % 2 === 0
                                  ? 'bg-[#F5F3EE]'
                                  : 'bg-white'
                            }
                          >
                            <td
                              className={`px-4 py-2.5 font-normal w-2/5 border-b ${
                                isDark ? 'text-[#8E8587] border-[#261619]' : 'text-[#5C5456] border-[#E0DBD2]'
                              }`}
                            >
                              {spec.name}
                            </td>
                            <td
                              className={`px-4 py-2.5 font-medium border-b ${
                                isDark ? 'text-[#F1EEEE] border-[#261619]' : 'text-[#140E10] border-[#E0DBD2]'
                              }`}
                            >
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                        {product.dimensionsCm && (
                          <tr className={isDark ? 'bg-[#130E10]' : 'bg-[#F5F3EE]'}>
                            <td
                              className={`px-4 py-2.5 font-normal border-b ${
                                isDark ? 'text-[#8E8587] border-[#261619]' : 'text-[#5C5456] border-[#E0DBD2]'
                              }`}
                            >
                              Dimensions
                            </td>
                            <td
                              className={`px-4 py-2.5 font-medium border-b ${
                                isDark ? 'text-[#F1EEEE] border-[#261619]' : 'text-[#140E10] border-[#E0DBD2]'
                              }`}
                            >
                              {product.dimensionsCm} cm
                            </td>
                          </tr>
                        )}
                        <tr className={isDark ? 'bg-[#0E0A0B]' : 'bg-white'}>
                          <td className={`px-4 py-2.5 font-normal ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                            Net Weight
                          </td>
                          <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                            {product.weightGrams} grams
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Accordion 3: Shipping & Warranty */}
          <div className={`border-b ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
            <button
              type="button"
              onClick={() => toggleAccordion('shipping')}
              className={`w-full py-4 flex items-center justify-between text-left font-medium hover:text-[#FF000E] transition-colors cursor-pointer ${
                isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'
              }`}
            >
              <span className={`text-base font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                Shipping &amp; Warranty
              </span>
              <i
                className={`bi ${openAccordions.shipping ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs ${
                  isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'
                }`}
              />
            </button>
            {openAccordions.shipping && (
              <div className={`pb-6 space-y-2 text-xs leading-relaxed text-left ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
                {(() => {
                  const customShipping = (product.specifications || []).filter(
                    (s) => s.group === 'Shipping & Warranty'
                  );
                  const courierText =
                    customShipping.find((s) => s.name === 'Free Express Courier')?.value ||
                    'Across India on all orders over ₹300 via BlueDart & Delhivery Express.';
                  const dispatchText =
                    customShipping.find((s) => s.name === 'Dispatch Guarantee')?.value ||
                    'Dispatched within 24 hours from Pune logistics facility.';
                  const returnsText =
                    customShipping.find((s) => s.name === '7-Day Returns')?.value ||
                    'Rapid replacement guarantee for transit or manufacturing issues.';

                  return (
                    <>
                      <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Free Express Courier:</strong> {courierText}</p>
                      <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Dispatch Guarantee:</strong> {dispatchText}</p>
                      <p>
                        • <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Manufacturer Warranty:</strong>{' '}
                        {product.warrantyMonths > 0
                          ? `${product.warrantyMonths} months comprehensive warranty coverage.`
                          : 'Standard manufacturer terms apply.'}
                      </p>
                      <p>• <strong className={isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}>Returns &amp; Replacement:</strong> {returnsText}</p>
                    </>
                  );
                })()}
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
              onClick={openReviewModal}
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
            {(() => {
              const customerReviews = reviews.filter(
                (r) => !/shrell\s*(operator|operations|admin|director)|operator/i.test(r.authorName)
              );
              if (customerReviews.length === 0) {
                return (
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
                      onClick={openReviewModal}
                      className="px-4 py-2 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Rate &amp; Review First
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {customerReviews.map((rev) => (
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
              );
            })()}
          </div>
        </section>

        {/* REVIEW & RATING SUBMISSION MODAL (3-Step Stepper) */}
        {isReviewModalOpen && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
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
              className={`relative z-10 w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col p-6 space-y-5 my-auto ${
                isDark ? 'bg-[#120E0F] border-[#2D161A] text-[#F1EEEE]' : 'bg-white border-[#E0DBD2] text-[#140E10]'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
              }`}>
                <div className="min-w-0 pr-3">
                  <h3 id="review-modal-title" className="text-sm font-bold uppercase tracking-wider font-mono">
                    Write a Customer Review
                  </h3>
                  <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                    {product.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-[#5C5456] hover:text-[#140E10]'
                  }`}
                  aria-label="Close review dialog"
                >
                  <i className="bi bi-x-lg text-xs" aria-hidden="true" />
                </button>
              </div>

              {reviewSuccessMsg ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF000E]/15 text-[#FF000E] flex items-center justify-center mx-auto text-2xl">
                    <i className="bi bi-check-lg" aria-hidden="true" />
                  </div>
                  <div className="text-sm font-bold text-[#FF000E] font-mono">
                    {reviewSuccessMsg}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-5 text-xs font-mono">
                  {/* Stepper Progress Header */}
                  <div className="flex items-center justify-between gap-2" aria-label="Review steps">
                    {[
                      { step: 1 as const, label: 'Rating' },
                      { step: 2 as const, label: 'Name' },
                      { step: 3 as const, label: 'Feedback' },
                    ].map((item) => {
                      const isCurrent = reviewStep === item.step;
                      const isDone = reviewStep > item.step;
                      return (
                        <div key={item.step} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full h-1.5 rounded-full transition-colors ${
                              isCurrent || isDone
                                ? 'bg-[#FF000E]'
                                : isDark
                                  ? 'bg-[#261619]'
                                  : 'bg-[#E0DBD2]'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isCurrent
                                ? 'text-[#FF000E]'
                                : isDone
                                  ? isDark
                                    ? 'text-slate-200'
                                    : 'text-[#140E10]'
                                  : isDark
                                    ? 'text-slate-500'
                                    : 'text-[#8E8587]'
                            }`}
                          >
                            {item.step}. {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* STEP 1: Star Rating (Brand Red Theme) */}
                  {reviewStep === 1 && (
                    <div className="space-y-4 py-2 text-center">
                      <label className={`block uppercase font-bold ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
                        How many stars would you give? *
                      </label>
                      <div className="flex items-center justify-center gap-2.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (reviewHoverRating || reviewRating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setReviewHoverRating(star)}
                              onMouseLeave={() => setReviewHoverRating(0)}
                              onClick={() => setReviewRating(star)}
                              className="text-3xl transition-transform hover:scale-110 cursor-pointer p-1"
                              aria-label={`${star} star rating`}
                            >
                              <i
                                className={`bi ${
                                  active
                                    ? 'bi-star-fill text-[#FF000E]'
                                    : isDark
                                      ? 'bi-star text-slate-600'
                                      : 'bi-star text-slate-300'
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-xs font-bold text-[#FF000E]">
                        {reviewRating === 5 && '5 Stars - Outstanding'}
                        {reviewRating === 4 && '4 Stars - Very Good'}
                        {reviewRating === 3 && '3 Stars - Average'}
                        {reviewRating === 2 && '2 Stars - Needs Improvement'}
                        {reviewRating === 1 && '1 Star - Poor'}
                      </div>

                      <div className={`pt-4 border-t flex items-center justify-between gap-3 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                        <button
                          type="button"
                          onClick={() => setIsReviewModalOpen(false)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-white' : 'text-[#5C5456] hover:text-[#140E10]'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStep(2)}
                          className="px-5 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Optional Name (Autofilled from Profile if logged in, saves Anonymous if empty) */}
                  {reviewStep === 2 && (
                    <div className="space-y-4 py-1">
                      <div>
                        <label htmlFor="review-author-input" className={`block uppercase font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
                          Your Name (Optional)
                        </label>
                        <input
                          id="review-author-input"
                          type="text"
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          placeholder="Leave blank to post as Anonymous"
                          className={`w-full border rounded-lg px-3.5 py-2.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                            isDark
                              ? 'bg-[#181113] border-[#261619] text-white placeholder:text-slate-500'
                              : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10] placeholder:text-[#8E8587]'
                          }`}
                        />
                        <p className={`text-[11px] mt-1.5 font-sans ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                          {reviewAuthor.trim()
                            ? `Will be displayed as "${reviewAuthor.trim()}".`
                            : 'If left blank, your review will be saved as Anonymous.'}
                        </p>
                      </div>

                      <div className={`pt-4 border-t flex items-center justify-between gap-3 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                        <button
                          type="button"
                          onClick={() => setReviewStep(1)}
                          className={`px-4 py-2 rounded-lg border font-medium transition-colors cursor-pointer ${
                            isDark
                              ? 'border-[#261619] text-slate-300 hover:bg-white/5'
                              : 'border-[#E0DBD2] text-[#3A3030] hover:bg-black/5'
                          }`}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStep(3)}
                          className="px-5 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Detailed Feedback (No headline; Cancel, Skip & Submit) */}
                  {reviewStep === 3 && (
                    <div className="space-y-4 py-1">
                      <div>
                        <label htmlFor="review-comment-input" className={`block uppercase font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
                          Detailed Feedback
                        </label>
                        <textarea
                          id="review-comment-input"
                          rows={4}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Describe ease of installation, finish quality, highway performance, fitment precision..."
                          className={`w-full border rounded-lg px-3.5 py-2.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                            isDark
                              ? 'bg-[#181113] border-[#261619] text-white placeholder:text-slate-500'
                              : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10] placeholder:text-[#8E8587]'
                          }`}
                        />
                      </div>

                      <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReviewStep(2)}
                            disabled={isSubmittingReview}
                            className={`px-3 py-2 rounded-lg border font-medium transition-colors cursor-pointer ${
                              isDark
                                ? 'border-[#261619] text-slate-300 hover:bg-white/5'
                                : 'border-[#E0DBD2] text-[#3A3030] hover:bg-black/5'
                            }`}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsReviewModalOpen(false)}
                            disabled={isSubmittingReview}
                            className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-white' : 'text-[#5C5456] hover:text-[#140E10]'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => submitCustomerReview(true)}
                            className={`px-3.5 py-2 rounded-lg border font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 ${
                              isDark
                                ? 'border-[#261619] text-slate-200 hover:bg-white/5'
                                : 'border-[#E0DBD2] text-[#140E10] hover:bg-black/5'
                            }`}
                          >
                            Skip
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingReview || !reviewComment.trim()}
                            className="px-4 py-2 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isSubmittingReview ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* Restock Notification Modal for Guests */}
        {isNotifyModalOpen && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
          >
            <div
              className="fixed inset-0 modal-backdrop-solid"
              onClick={() => setIsNotifyModalOpen(false)}
              aria-hidden="true"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden my-auto p-6 space-y-4 ${
                isDark ? 'bg-[#0A0A0A] border-[#261619] text-[#F1EEEE]' : 'bg-white border-[#E0DBD2] text-[#140E10]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider font-mono">
                    <i className="bi bi-bell-fill text-[9px]" /> Back in Stock Alert
                  </span>
                  <h3 className="text-base font-bold tracking-tight">Notify When on Order</h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-[#605859]'}`}>
                    Enter your phone number or email to receive an instant alert when this equipment is available.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotifyModalOpen(false)}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                  }`}
                  aria-label="Close modal"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Product preview card */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-[#FAF8F4] border-[#E0DBD2]'
              }`}>
                <div className="w-12 h-12 rounded-lg bg-neutral-900/10 overflow-hidden flex items-center justify-center p-1 shrink-0">
                  <img
                    src={product?.images?.[0]?.url || '/logos/shrell-brandicon_no-bg.png'}
                    alt={product?.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold truncate">{product?.name}</h4>
                  <p className="text-[11px] font-mono opacity-60">SKU: {product?.sku}</p>
                </div>
              </div>

              {notifySuccessMsg ? (
                <div className="space-y-3 pt-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto text-xl">
                    <i className="bi bi-check-lg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-500">Alert Confirmed!</h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-[#5C5456]'}`}>
                      {notifySuccessMsg}
                    </p>
                  </div>
                  {notifyWhatsAppLink && (
                    <a
                      href={notifyWhatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <i className="bi bi-whatsapp text-sm" />
                      <span>Send Notice to Admin via WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotifyModalOpen(false)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isDark ? 'border-[#261619] hover:bg-neutral-900' : 'border-[#E0DBD2] hover:bg-neutral-100'
                    }`}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitGuestNotification} className="space-y-3 pt-1">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-neutral-300' : 'text-neutral-700'
                    }`}>
                      Phone Number or Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={notifyContact}
                      onChange={(e) => setNotifyContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210 or yourname@gmail.com"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-[#120E0F] border-[#261619] text-white focus:border-amber-500'
                          : 'bg-white border-[#E0DBD2] text-black focus:border-amber-500'
                      }`}
                    />
                    {notifyError && (
                      <p className="text-[11px] text-rose-500 mt-1">{notifyError}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNotifyModalOpen(false)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        isDark ? 'border-[#261619] text-neutral-300 hover:bg-neutral-900' : 'border-[#E0DBD2] text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNotify}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {isSubmittingNotify ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-bell-fill text-xs" />
                          <span>Register Alert</span>
                        </>
                      )}
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
