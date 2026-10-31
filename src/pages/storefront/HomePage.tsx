import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, HeroBanner } from '../../domain/types';
import { productRepository, bannerRepository } from '../../infrastructure/repositories';
import { ProductCard } from '../../components/ui/ProductCard';
import { ShrellLoader } from '../../components/common/ShrellLoader';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Swipe sensitivity threshold
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
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

  useEffect(() => {
    async function loadData() {
      try {
        const [prodResult, bannerResult] = await Promise.all([
          productRepository.getAll({ limit: 8 }),
          bannerRepository.getAll(),
        ]);
        setFeaturedProducts(prodResult.products);
        setBanners(bannerResult);
      } catch (err) {
        console.error('Failed to load home page catalogue data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Carousel timer loop
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const categoryIcons = [
    { id: 'all', icon: 'bi-grid-fill', label: 'All', to: '/catalogue' },
    { id: 'freshner', icon: 'bi-tree-fill', label: 'Air Freshener', to: '/catalogue?category=air-fresheners' },
    { id: 'lighting', icon: 'bi-lightbulb-fill', label: 'Lighting', to: '/catalogue?category=auxiliary-lighting' },
    { id: 'mats', icon: 'floor-mat', label: 'Floor Mats', to: '/catalogue?category=all-weather-floor-protection' },
    { id: 'cams', icon: 'bi-camera-video-fill', label: 'Dash Cams', to: '/catalogue?category=dash-cameras' },
    { id: 'tyre', icon: 'tyre-care', label: 'Tyre Care', to: '/catalogue?category=tyre-care-air-systems' },
    { id: 'recovery', icon: 'bi-tools', label: 'Recovery', to: '/catalogue?category=touring-recovery-gear' },
    { id: 'audio', icon: 'bi-speaker-fill', label: 'Audio & Tech', to: '/catalogue?category=audio' },
    { id: 'wash', icon: 'bi-droplet-half', label: 'Car Care', to: '/catalogue?category=car-care' },
    { id: 'cooling', icon: 'bi-thermometer-half', label: 'Cooling', to: '/catalogue?category=cooling-systems' },
    { id: 'power', icon: 'bi-usb-plug-fill', label: 'Chargers', to: '/catalogue?category=charging-power' },
    { id: 'more', icon: 'bi-boxes', label: 'Others', to: '/catalogue' },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-20">
      {/* 
        ================================================================
        DARK TOP ZONE (Circle Theme Header Shell)
        Reduced height for mobile and desktop
        Holds Category Strip + Image-Only Carousel Banner
        ================================================================
      */}
      <section className="bg-[#0A0808] text-white pt-1 sm:pt-2 pb-4 sm:pb-6 rounded-b-xl sm:rounded-b-2xl border-b border-[#221215]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
          {/* Category Icons Row (Circle Style) - completely hidden scrollbar */}
          <div
            className="overflow-x-auto no-scrollbar pt-1 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center gap-6 sm:gap-9 min-w-max justify-start md:justify-center">
              {categoryIcons.map((cat) => {
                const isActive = activeCategoryTab === cat.id;
                return (
                  <Link
                    key={cat.id}
                    to={cat.to}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className="flex flex-col items-center gap-1 group min-w-[48px] sm:min-w-[54px] relative pb-1.5 transition-all"
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'text-[#FF000E]'
                          : 'text-gray-400 group-hover:text-white'
                      }`}
                    >
                      {cat.id === 'freshner' ? (
                        <i className="bi bi-tree-fill text-lg sm:text-xl leading-none" aria-hidden="true"></i>
                      ) : cat.id === 'mats' ? (
                        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
                          <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3h-15ZM5 5h14v14H5V5Zm3 3a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Z"/>
                        </svg>
                      ) : cat.id === 'tyre' ? (
                        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm-8 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8-5.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-1-4.25a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-1.5 0v-1.5Zm0 7a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-1.5 0v-1.5Zm-4.25-2.25a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5h-1.5Zm7 0a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5h-1.5Z"/>
                        </svg>
                      ) : (
                        <i className={`bi ${cat.icon} text-lg sm:text-xl leading-none`} aria-hidden="true"></i>
                      )}
                    </div>
                    <span
                      className={`text-[11px] sm:text-[12px] font-medium tracking-tight text-center whitespace-nowrap transition-colors ${
                        isActive ? 'text-[#FF000E] font-semibold' : 'text-gray-400 group-hover:text-gray-200'
                      }`}
                    >
                      {cat.label}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-2 h-0.5 bg-[#FF000E] rounded-full transition-all"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 
            Pure Image-Only Banner Carousel
            Height strictly constrained so hero never stretches when image height is large.
            Supports manual swipe gestures on mobile devices.
            Clicking banner navigates directly to target page.
          */}
          {banners.length > 0 && (
            <div
              className="relative rounded-lg overflow-hidden bg-transparent group flex items-center justify-center w-full max-h-[180px] sm:max-h-[260px] md:max-h-[480px] lg:max-h-[560px] xl:max-h-[620px] select-none touch-pan-y"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
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
                    src={banners[currentSlide]?.desktopImageUrl}
                    alt={banners[currentSlide]?.altText || 'Hero Banner'}
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
                    src={banners[currentSlide]?.mobileImageUrl || banners[currentSlide]?.desktopImageUrl}
                    alt={banners[currentSlide]?.altText || 'Hero Banner'}
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

              {/* Prev / Next Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Previous banner"
                  >
                    <i className="bi bi-chevron-left text-sm sm:text-base"></i>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
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
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
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

      {/* 
        ================================================================
        PRODUCT CONTENT ZONE (Matches Hero & Header #0A0808 aesthetic)
        All Product Content, Categories, and Systems
        ================================================================
      */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
        {/* SECTION 1: Crazy Finds */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-[#221215] pb-2.5 sm:pb-3 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F1EEEE] tracking-tight">
                Crazy Finds
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-normal">
                Blink and you'll miss it
              </p>
            </div>
            <Link
              to="/catalogue"
              className="text-xs sm:text-sm font-semibold text-[#FF000E] hover:text-[#E0000C] flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <span>See All</span>
              <i className="bi bi-chevron-right text-[10px] sm:text-xs" aria-hidden="true"></i>
            </Link>
          </div>

          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <ShrellLoader size={64} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: Festival Declutter Deals */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-[#221215] pb-2.5 sm:pb-3 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F1EEEE] tracking-tight">
                Festival Declutter Deals 🪔
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-normal">
                Verified genuine equipment with up to ₹15,000 instant festival discounts
              </p>
            </div>
            <Link
              to="/catalogue"
              className="text-xs sm:text-sm font-semibold text-[#FF000E] hover:text-[#E0000C] flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <span>See All</span>
              <i className="bi bi-chevron-right text-[10px] sm:text-xs" aria-hidden="true"></i>
            </Link>
          </div>

          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <ShrellLoader size={64} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.slice(4, 8).length > 0 ? (
                featuredProducts.slice(4, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                featuredProducts.slice(0, 4).map((product) => (
                  <ProductCard key={`alt-${product.id}`} product={product} />
                ))
              )}
            </div>
          )}
        </section>

        {/* SECTION 3: Titleless Editorial Bento Grid (Exact match to reference design) */}
        <section className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
            {/* LEFT COLUMN: 2 Cards (4 cols on desktop) */}
            <div className="md:col-span-4 flex flex-col gap-4">
              {/* Card 1: Light Off-White Panel with Shrell Washing Spray (imaged2.webp) */}
              <div className="rounded-2xl bg-[#F7F5F5] text-[#140E10] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[220px] sm:min-h-[240px] group border border-white/40 shadow-sm">
                <div className="flex items-start justify-between z-10">
                  <div className="w-28 sm:w-32 h-28 sm:h-32 -ml-2 -mt-2 relative">
                    <img
                      src="/imaged2.webp"
                      alt="SHRELL Clay Bar & Washing Spray"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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

              {/* Card 2: Dark Graphite Panel (SHRELL removed, updated for ceramic brakes) */}
              <div className="rounded-2xl bg-[#0E0A0B] border border-[#221215] p-6 sm:p-7 flex flex-col justify-between flex-1 min-h-[200px] group hover:border-[#4F242C] transition-all">
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F1EEEE] tracking-tight leading-tight">
                    Ceramic Brake<br />Rotors &amp; Pads
                  </h3>
                  <p className="text-xs text-[#8E8587] leading-relaxed">
                    Ultra-premium stopping power with thermal dissipating vents.
                  </p>
                </div>

                <div className="pt-4 flex items-end justify-between border-t border-[#221215] mt-4">
                  <div>
                    <p className="text-[11px] sm:text-xs text-[#8E8587] leading-tight">
                      Satisfied drivers<br />around the world
                    </p>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#FF000E] tracking-tight">
                    12.4K<sup className="text-sm sm:text-base font-bold">+</sup>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE COLUMN: Tall Hero Card with Delivery Box (imaged.webp, Tag removed) */}
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
                    className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Subtle dark vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0808] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(255,0,14,0.12),transparent_70%)] pointer-events-none" />
                </div>

                {/* Empty top slot (Access laser cutting tag removed) */}
                <div className="relative z-10" />

                {/* Bottom Tagline & Link */}
                <div className="relative z-10 pt-6">
                  <Link
                    to="/catalogue"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 hover:bg-[#FF000E] text-white border border-[#3A141A] hover:border-[#FF000E] text-xs font-semibold backdrop-blur-md transition-all group/btn shadow-lg"
                  >
                    <span>Express Doorstep Delivery</span>
                    <i className="bi bi-arrow-right text-xs group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Red Hero Card + Square Badge Tile (4 cols on desktop) */}
            <div className="md:col-span-4 flex flex-col gap-4">
              {/* Card 4: Signature Crimson Red Card with Chamfer Cut (SHRELL removed) */}
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

                <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/20">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/80">
                    Fast Express Courier
                  </span>
                  <Link
                    to="/catalogue"
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#FF000E] flex items-center justify-center transition-all"
                    aria-label="Catalogue"
                  >
                    <i className="bi bi-chevron-right text-xs" />
                  </Link>
                </div>
              </div>

              {/* Card 5: Square Brand Accent Tile */}
              <div className="rounded-2xl bg-[#FF000E] p-6 flex items-center justify-center relative overflow-hidden h-[130px] sm:h-[140px] group shadow-[0_8px_24px_rgba(255,0,14,0.25)]">
                <div className="w-20 h-20 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  {/* Clean White Cutout Logo Emblem */}
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

        {/* SECTION 4: Rigorous Material Testing & Indian Conditions */}
        <section className="bg-[#0E0A0B] rounded-xl border border-[#221215] p-5 sm:p-10 space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F1EEEE] tracking-tight">
              Rigorous Material Testing for Indian Highways &amp; Weather
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed font-normal">
              Accessories face high ambient heat up to 48°C, heavy monsoonal moisture, and continuous vibration. Every component adheres to stringent automotive durability standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 rounded-lg bg-[#130E10] border border-[#221215] space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#1D1214] border border-[#2F171B] flex items-center justify-center text-[#FF000E] text-lg">
                <i className="bi bi-wrench-adjustable-circle-fill" aria-hidden="true"></i>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[#F1EEEE]">Zero Drilling Fitment</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                All roof crossbars and floor protection systems mount using factory OEM points, preserving vehicle chassis integrity and original manufacturer warranties.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#130E10] border border-[#221215] space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#1D1214] border border-[#2F171B] flex items-center justify-center text-[#FF000E] text-lg">
                <i className="bi bi-shield-fill-check" aria-hidden="true"></i>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[#F1EEEE]">Medical-Grade TPE Compounds</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Our floor liners utilize 100% recyclable thermoplastic elastomer with zero toxic phthalates or noxious rubber odors, even under intense direct sunlight.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#130E10] border border-[#221215] space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#1D1214] border border-[#2F171B] flex items-center justify-center text-[#FF000E] text-lg">
                <i className="bi bi-patch-check-fill" aria-hidden="true"></i>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[#F1EEEE]">ECE R112 Homologation</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                OSRAM auxiliary driving illumination meets certified beam geometry standards, providing safe forward visibility without blinding oncoming traffic.
              </p>
            </div>
          </div>

          {/* 4 Trust USP Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#221215]">
            {[
              { icon: 'bi-truck', label: 'Pan-India Delivery', sub: 'Express Courier' },
              { icon: 'bi-credit-card-2-front-fill', label: 'UPI & COD Available', sub: 'Zero fee payments' },
              { icon: 'bi-headset', label: 'Technical Desk', sub: 'Engineer backed' },
              { icon: 'bi-recycle', label: '100% Recyclable TPE', sub: 'Zero toxic odor' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-[#130E10] border border-[#221215]">
                <i className={`bi ${item.icon} text-[#FF000E] text-xl flex-shrink-0`} aria-hidden="true"></i>
                <div>
                  <div className="text-xs text-[#F1EEEE] font-semibold leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
