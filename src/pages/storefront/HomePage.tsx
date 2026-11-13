import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, HeroBanner, HomeSection, Category } from '../../domain/types';
import {
  productRepository,
  bannerRepository,
  homeSectionRepository,
  categoryRepository,
} from '../../infrastructure/repositories';
import { ProductCard } from '../../components/ui/ProductCard';
import { HomePageSkeleton } from '../../components/common/ShimmerSkeleton';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import { generateOrganizationSchema, generateWebSiteSchema } from '../../infrastructure/seo/schemaGenerators';

export const HomePage: React.FC = () => {
  const { finishPageLoad } = useNavigationLoading();
  const { settings } = useCart();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isManualPaused, setIsManualPaused] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const manualPauseTimerRef = useRef<number | null>(null);
  const wheelCooldownRef = useRef<number>(0);

  // Pause auto-slide cleanly until 3 seconds after user finishes interacting/scrolling horizontally
  const pauseAutoSlideFor3Seconds = () => {
    setIsManualPaused(true);
    if (manualPauseTimerRef.current !== null) {
      window.clearTimeout(manualPauseTimerRef.current);
    }
    manualPauseTimerRef.current = window.setTimeout(() => {
      setIsManualPaused(false);
      manualPauseTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (manualPauseTimerRef.current !== null) {
        window.clearTimeout(manualPauseTimerRef.current);
      }
    };
  }, []);

  // Swipe sensitivity threshold
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    pauseAutoSlideFor3Seconds();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    pauseAutoSlideFor3Seconds();
  };

  const onTouchEnd = () => {
    pauseAutoSlideFor3Seconds();
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && banners.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe && banners.length > 1) {
      setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
  };

  const onBannerWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 6) {
      pauseAutoSlideFor3Seconds();
      const now = Date.now();
      if (banners.length > 1 && now - wheelCooldownRef.current > 450 && Math.abs(e.deltaX) > 18) {
        wheelCooldownRef.current = now;
        if (e.deltaX > 0) {
          setCurrentSlide((prev) => (prev + 1) % banners.length);
        } else {
          setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
        }
      }
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [prodResult, bannerResult, sectionList, catList] = await Promise.all([
          productRepository.getAll({ limit: 40 }),
          bannerRepository.getAll(),
          homeSectionRepository.getAll(),
          categoryRepository.getAll(),
        ]);
        setFeaturedProducts(prodResult.products);
        setBanners(bannerResult);
        setHomeSections(sectionList);
        setCategories(catList);
      } catch (err) {
        console.error('Failed to load home page catalogue data:', err);
      } finally {
        setLoading(false);
        finishPageLoad();
      }
    }
    loadData();
  }, [finishPageLoad]);

  // Carousel timer loop
  useEffect(() => {
    if (banners.length <= 1 || isPaused || isManualPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length, isPaused, isManualPaused]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pauseAutoSlideFor3Seconds();
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pauseAutoSlideFor3Seconds();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // Helper to slice or filter products according to section configuration
  const getProductsForSection = (section: HomeSection, index: number): Product[] => {
    const limit = section.limit || 4;

    if (section.categorySlug) {
      const slugLower = section.categorySlug.toLowerCase();
      const matchedCat = categories.find(
        (c) => c.slug.toLowerCase() === slugLower || c.id.toLowerCase() === slugLower
      );

      const filtered = featuredProducts.filter((p) => {
        if (matchedCat && p.categoryId === matchedCat.id) return true;
        return (
          p.categoryName?.toLowerCase().includes(slugLower) ||
          p.categoryId?.toLowerCase().includes(slugLower)
        );
      });

      if (filtered.length > 0) {
        return filtered.slice(0, limit);
      }
    }

    // Default distribution: stagger by section order
    const offset = (index * limit) % Math.max(1, featuredProducts.length);
    const slice = featuredProducts.slice(offset, offset + limit);
    return slice.length > 0 ? slice : featuredProducts.slice(0, limit);
  };

  // Filter active sections and sort by display order
  const activeSections = homeSections
    .filter((sec) => sec.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="space-y-1 sm:space-y-10 pb-20">
      <SEOHead
        title={settings.ogTitle || 'SHRELL Automotive | Premium Car Accessories in India'}
        description={
          settings.ogDescription ||
          'Shop premium car accessories and touring equipment for Indian vehicles. OSRAM auxiliary lighting, aerodynamic crossbars, 7D floor liners, and heavy-duty 12V tyre inflators.'
        }
        canonicalPath="/"
        ogType="website"
        ogImage={settings.ogImageUrl || '/shrell-opengraph.png'}
        ogImageAlt={settings.ogImageAlt || 'SHRELL Automotive - Premium Car Accessories & Touring Equipment'}
        structuredData={[generateOrganizationSchema(), generateWebSiteSchema()]}
      />
      <h1 className="sr-only">SHRELL Automotive | Premium Car Accessories in India</h1>
      {/* 
        ================================================================
        Hero Banner Section (No Background)
        Height strictly constrained so hero never stretches when image height is large.
        Supports manual swipe gestures on mobile devices.
        Clicking banner navigates directly to target page.
        ================================================================
      */}
      <section className="pt-1 sm:pt-1 pb-[0.3cm] sm:pb-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {banners.length > 0 && (
            <div
              className="relative rounded-lg overflow-hidden bg-transparent group flex items-center justify-center w-full max-h-[180px] sm:max-h-[260px] md:max-h-[480px] lg:max-h-[560px] xl:max-h-[620px] select-none touch-pan-y"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onWheel={onBannerWheel}
            >
              {/* Active Banner Slide with Link */}
              <div className="w-full relative transition-all duration-300 flex items-center justify-center">
                <Link
                  to={banners[currentSlide]?.targetUrl || '/catalogue'}
                  className="block w-full focus:outline-none flex items-center justify-center"
                  aria-label={banners[currentSlide]?.altText || 'Featured Automotive Banner'}
                >
                  {/* Desktop Image Banner (Bigger on desktop browser) */}
                  <img
                    src={banners[currentSlide]?.desktopImageUrl?.replace(/^http:\/\/res\.cloudinary\.com\//, 'https://res.cloudinary.com/')}
                    alt={banners[currentSlide]?.altText || 'Hero Banner'}
                    referrerPolicy="no-referrer"
                    className="hidden md:block w-full max-h-[480px] lg:max-h-[560px] xl:max-h-[620px] object-cover sm:object-contain rounded-lg mx-auto"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/shrell-opengraph.png')) {
                        target.src = '/shrell-opengraph.png';
                      }
                    }}
                  />

                  {/* Mobile Image Banner (Strictly unchanged) */}
                  <img
                    src={(banners[currentSlide]?.mobileImageUrl || banners[currentSlide]?.desktopImageUrl)?.replace(/^http:\/\/res\.cloudinary\.com\//, 'https://res.cloudinary.com/')}
                    alt={banners[currentSlide]?.altText || 'Hero Banner'}
                    referrerPolicy="no-referrer"
                    className="block md:hidden w-full max-h-[180px] object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/shrell-opengraph.png')) {
                        target.src = '/shrell-opengraph.png';
                      }
                    }}
                  />
                </Link>
              </div>

              {/* Prev / Next Arrows (Desktop only, hidden on mobile browsers) */}
              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="hidden md:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                    aria-label="Previous banner"
                  >
                    <i className="bi bi-chevron-left text-sm sm:text-base"></i>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="hidden md:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                    aria-label="Next banner"
                  >
                    <i className="bi bi-chevron-right text-sm sm:text-base"></i>
                  </button>

                  {/* Indicator Dots */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                    {banners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          pauseAutoSlideFor3Seconds();
                          setCurrentSlide(idx);
                        }}
                        aria-label={`Slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentSlide === idx ? 'w-6 bg-[#FF000E] shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* DYNAMIC PRODUCT & CMS CONTENT ZONE */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 pt-0 sm:pt-2">
        {activeSections.map((section, secIdx) => {
          // =================================================================
          // 1. PRODUCT GRID SECTION (Crazy Finds, Deals, Category Showcases)
          // =================================================================
          if (section.sectionType === 'PRODUCTS_GRID') {
            const secProducts = getProductsForSection(section, secIdx);
            return (
              <section key={section.id} className="space-y-4 sm:space-y-5">
                <div className={`flex items-center justify-between border-b pb-2.5 sm:pb-3 gap-3 ${isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'}`}>
                  <div className="min-w-0">
                    <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className={`text-xs sm:text-sm mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  <Link
                    to={section.viewAllUrl || (section.categorySlug ? `/catalogue?category=${section.categorySlug}` : '/catalogue')}
                    className="text-xs sm:text-sm font-semibold text-[#FF000E] hover:text-[#E0000C] flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <span>See All</span>
                    <i className="bi bi-chevron-right text-[10px] sm:text-xs" aria-hidden="true"></i>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {secProducts.length > 0 ? (
                    secProducts.map((product, pIdx) => (
                      <ProductCard key={`${section.id}-${product.id}-${pIdx}`} product={product} />
                    ))
                  ) : (
                    <div className="col-span-full h-44 flex items-center justify-center">
                      <p className="text-sm text-[#8E8587]">No items found in this section.</p>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // =================================================================
          // 2. PRODUCT CAROUSEL SECTION (Horizontal Smooth Scroll)
          // =================================================================
          if (section.sectionType === 'PRODUCTS_CAROUSEL') {
            const secProducts = getProductsForSection(section, secIdx);
            return (
              <section key={section.id} className="space-y-4 sm:space-y-5">
                <div className={`flex items-center justify-between border-b pb-2.5 sm:pb-3 gap-3 ${isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'}`}>
                  <div className="min-w-0">
                    <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className={`text-xs sm:text-sm mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  <Link
                    to={section.viewAllUrl || (section.categorySlug ? `/catalogue?category=${section.categorySlug}` : '/catalogue')}
                    className="text-xs sm:text-sm font-semibold text-[#FF000E] hover:text-[#E0000C] flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <span>See All</span>
                    <i className="bi bi-chevron-right text-[10px] sm:text-xs" aria-hidden="true"></i>
                  </Link>
                </div>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none">
                  {secProducts.map((product, pIdx) => (
                    <div key={`carousel-${section.id}-${product.id}-${pIdx}`} className="w-[170px] sm:w-[220px] md:w-[260px] flex-shrink-0 snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // =================================================================
          // 3. CATEGORIES GRID (Shop by Category)
          // =================================================================
          if (section.sectionType === 'CATEGORIES_GRID') {
            const activeCats = categories.filter((c) => c.isActive);
            return (
              <section key={section.id} className="space-y-4 sm:space-y-5">
                <div className={`flex items-center justify-between border-b pb-2.5 sm:pb-3 gap-3 ${isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'}`}>
                  <div className="min-w-0">
                    <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                      {section.title || 'Shop By Category'}
                    </h2>
                    {section.subtitle && (
                      <p className={`text-xs sm:text-sm mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  <Link
                    to={section.viewAllUrl || '/catalogue'}
                    className="text-xs sm:text-sm font-semibold text-[#FF000E] hover:text-[#E0000C] flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <span>All Categories</span>
                    <i className="bi bi-chevron-right text-[10px] sm:text-xs" aria-hidden="true"></i>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {activeCats.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/catalogue?category=${cat.slug}`}
                      className={`group rounded-2xl border p-4 sm:p-5 flex flex-col items-center text-center justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
                        isDark
                          ? 'bg-[#0E0A0B] border-[#221215] hover:border-[#FF000E]/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                          : 'bg-[#FFFEFA] border-[#E0DBD2] hover:border-[#FF000E]/50 shadow-sm'
                      }`}
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-2 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain" />
                        ) : (
                          <i className="bi bi-tag text-2xl text-[#FF000E]" />
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 transition-colors ${
                        isDark ? 'text-[#F1EEEE] group-hover:text-[#FF000E]' : 'text-[#140E10] group-hover:text-[#FF000E]'
                      }`}>
                        {cat.name}
                      </span>
                      <span className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-[#8E8587]'}`}>
                        View Gear →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          // =================================================================
          // 4. PROMO BANNER SECTION
          // =================================================================
          if (section.sectionType === 'BANNER_PROMO' && section.customBannerUrl) {
            return (
              <section key={section.id} className="pt-2">
                <Link
                  to={section.customBannerTargetUrl || section.viewAllUrl || '/catalogue'}
                  className="block rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.01] group cursor-pointer"
                  style={{ borderColor: isDark ? '#221215' : '#E0DBD2' }}
                >
                  <img
                    src={section.customBannerUrl}
                    alt={section.title}
                    className="w-full h-auto max-h-[320px] object-cover"
                  />
                </Link>
              </section>
            );
          }

          // =================================================================
          // 5. EDITORIAL BENTO GRID (Preserved exact design & precision)
          // =================================================================
          if (section.sectionType === 'EDITORIAL_BENTO') {
            return (
              <section key={section.id} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
                  {/* LEFT COLUMN: 2 Cards (4 cols on desktop) */}
                  <div className="md:col-span-4 flex flex-col gap-4">
                    {/* Card 1: Light Off-White Panel with Shrell Washing Spray (imaged2.webp) */}
                    <div className="rounded-2xl bg-[#F7F5F5] text-[#140E10] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[230px] sm:min-h-[250px] group border border-white/40 shadow-sm">
                      <div className="flex items-start justify-between z-10">
                        <div className="w-32 sm:w-40 h-32 sm:h-40 -ml-2 -mt-2 relative flex-shrink-0">
                          <img
                            src="/imaged2.webp"
                            alt="SHRELL Clay Bar & Washing Spray"
                            className="w-full h-full object-contain scale-110 sm:scale-120"
                          />
                        </div>
                        <div className="text-right">
                          <span className="block text-3xl sm:text-4xl font-extrabold text-[#FF000E] tracking-tight leading-none">
                            99%
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-[#140E10] mt-1.5 leading-snug">
                            Streak-Free<br />Paint Shine
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-[#5C5456] uppercase tracking-wider">
                        <span>Clay Bar &amp; Detailing Spray</span>
                        <span className="text-[#FF000E] font-semibold">500ml Kit</span>
                      </div>
                    </div>

                    {/* Card 2: Ultra Shampoo Editorial Product Poster */}
                    <div className="rounded-2xl bg-[#0A0808] border border-[#221215] p-5 pb-1 sm:p-6 flex flex-col justify-between flex-1 min-h-[260px] sm:min-h-[275px] group hover:border-[#4F242C] transition-all relative overflow-hidden">
                      {/* Subtle poster radial accent behind bottles */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'radial-gradient(circle at 82% 82%, rgba(255, 0, 14, 0.18) 0%, rgba(136, 67, 177, 0.12) 38%, rgba(10, 8, 8, 0) 70%)',
                        }}
                        aria-hidden="true"
                      />

                      <div className="relative z-10 flex flex-col gap-3">
                        {/* Poster Top Header Bar */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#FF000E]">
                            SHRELL DETAILING
                          </span>
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-300">
                            500 ML • pH-NEUTRAL
                          </span>
                        </div>

                        {/* Poster Title, Specs & Scents */}
                        <div className="space-y-2.5">
                          <div>
                            <h3 className="text-2xl sm:text-[28px] font-black text-white uppercase tracking-tight leading-[0.95]">
                              ULTRA<br />SHAMPOO
                            </h3>
                            <p className="text-[11px] font-mono text-slate-300 mt-1.5 leading-snug">
                              30 to 50 washes. Foam + lubricants, safe for wax &amp; sealants.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border"
                              style={{
                                backgroundColor: 'rgba(136, 67, 177, 0.28)',
                                color: '#E9D5FF',
                                borderColor: 'rgba(136, 67, 177, 0.5)',
                              }}
                            >
                              Lavender Breeze
                            </span>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border"
                              style={{
                                backgroundColor: 'rgba(231, 83, 6, 0.28)',
                                color: '#FED7AA',
                                borderColor: 'rgba(231, 83, 6, 0.5)',
                              }}
                            >
                              Passionfruit Martini
                            </span>
                          </div>
                        </div>

                        {/* Poster CTA above Hero Image */}
                        <div>
                          <Link
                            to="/pre-book"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer"
                          >
                            <span>Pre-Book Now</span>
                            <i className="bi bi-arrow-right text-[10px]" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>

                      {/* Poster Hero Subject: SUV + Twin Ultra Shampoo Bottles */}
                      <div className="relative z-10 mt-3 w-full h-36 sm:h-44 flex items-end justify-end overflow-hidden pointer-events-none">
                        <img
                          src="/suv.webp"
                          alt="SHRELL Ultra Shampoo Lavender Breeze and Passionfruit Martini 500ml bottles"
                          className="max-h-full w-auto max-w-full object-contain object-bottom group-hover:scale-105 origin-bottom transition-transform duration-300"
                          style={{ filter: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE COLUMN: Tall Hero Card with Delivery Box */}
                  <div className="md:col-span-4 relative group">
                    <div
                      className="h-full min-h-[380px] sm:min-h-[460px] rounded-2xl bg-[#0A0808] border border-[#221215] hover:border-[#FF000E]/40 overflow-hidden relative flex flex-col justify-between p-6 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                      style={{
                        clipPath: 'polygon(36px 0, 100% 0, 100% 100%, 0 100%, 0 36px)',
                      }}
                    >
                      {/* Background Delivery Man Image (imaged.webp) */}
                      <div className="absolute inset-0 z-0 overflow-hidden">
                        <img
                          src="/imaged.webp"
                          alt="SHRELL Express Delivery"
                          className="w-full h-full object-cover object-top"
                          style={{ filter: 'none' } as React.CSSProperties}
                        />
                        {/* Subtle dark vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0808] via-transparent to-transparent pointer-events-none" />
                      </div>

                      <div className="relative z-10" />

                      {/* Bottom Tagline & Link */}
                      <div className="relative z-10 pt-6">
                        <Link
                          to="/catalogue"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 hover:bg-[#FF000E] text-white border border-[#3A141A] hover:border-[#FF000E] text-xs font-semibold backdrop-blur-md transition-all group/btn shadow-lg cursor-pointer"
                        >
                          <span>Express Doorstep Delivery</span>
                          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <i className="bi bi-arrow-right text-[10px] group-hover/btn:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Red Hero Card + Square Badge Tile (4 cols on desktop) */}
                  <div className="md:col-span-4 flex flex-col gap-4">
                    {/* Card 4: Signature Crimson Red Card with Chamfer Cut */}
                    <div
                      className="rounded-2xl bg-gradient-to-br from-[#FF000E] via-[#E0000C] to-[#B0000A] text-white p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between flex-1 min-h-[260px] sm:min-h-[290px] shadow-[0_12px_36px_rgba(255,0,14,0.3)] transition-all group"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 36px), calc(100% - 36px) 100%, 0 100%)',
                      }}
                    >
                      <div className="space-y-4 relative z-10">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                          Doorstep Express<br />Nationwide<br />Delivery
                        </h3>

                        <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-sans max-w-xs">
                          Get premium automotive upgrades, genuine brake systems, and professional detailing kits delivered straight to your garage across 19,000+ pin codes.
                        </p>
                      </div>

                      <div className="relative z-10 pt-4 space-y-3">
                        <div className="w-full h-44 sm:h-48 flex items-center justify-center">
                          <img
                            src="/images/bento/shrell-truck.webp"
                            alt="SHRELL Branded Delivery Truck"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-white/20 pt-3">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-white/80">
                            Fast Express Courier
                          </span>
                          <Link
                            to="/track"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#FF000E] text-[10px] font-semibold transition-all cursor-pointer"
                            aria-label="Track Your Delivery"
                          >
                            <i className="bi bi-box-seam text-xs" />
                            <span>Track Delivery</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Square Brand Accent Tile */}
                    <div className="rounded-2xl bg-[#FF000E] p-6 flex items-center justify-center relative overflow-hidden h-[130px] sm:h-[140px] group shadow-[0_8px_24px_rgba(255,0,14,0.25)]">
                      <div className="w-20 h-20 relative flex items-center justify-center">
                        <img
                          src="/logos/shrell-brandicon_no-bg.png"
                          alt="Shrell Emblem"
                          className="w-full h-full object-contain filter brightness-0 invert drop-shadow-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

