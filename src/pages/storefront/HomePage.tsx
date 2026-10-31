import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Category, Product, HeroBanner } from '../../domain/types';
import { categoryRepository, productRepository, bannerRepository } from '../../infrastructure/repositories';
import { ProductCard } from '../../components/ui/ProductCard';
import { ShrellLoader } from '../../components/common/ShrellLoader';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
        const [prodResult, catResult, bannerResult] = await Promise.all([
          productRepository.getAll({ limit: 8 }),
          categoryRepository.getAll(),
          bannerRepository.getAll(),
        ]);
        setFeaturedProducts(prodResult.products);
        setCategories(catResult);
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
    { id: 'roof', icon: 'bi-layers-fill', label: 'Roof Racks', to: '/catalogue?category=roof-racks-cargo' },
    { id: 'lighting', icon: 'bi-lightbulb-fill', label: 'Lighting', to: '/catalogue?category=auxiliary-lighting' },
    { id: 'mats', icon: 'bi-shield-fill-check', label: 'Floor Mats', to: '/catalogue?category=all-weather-floor-protection' },
    { id: 'cams', icon: 'bi-camera-video-fill', label: 'Dash Cams', to: '/catalogue?category=dash-cameras' },
    { id: 'tyre', icon: 'bi-speedometer2', label: 'Tyre Care', to: '/catalogue?category=tyre-care-air-systems' },
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
                      <i className={`bi ${cat.icon} text-lg sm:text-xl leading-none`} aria-hidden="true"></i>
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
                  />

                  {/* Mobile Image Banner (Strictly unchanged) */}
                  <img
                    src={banners[currentSlide]?.mobileImageUrl || banners[currentSlide]?.desktopImageUrl}
                    alt={banners[currentSlide]?.altText || 'Hero Banner'}
                    className="block md:hidden w-full max-h-[180px] object-cover rounded-lg"
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

        {/* SECTION 3: Curated Equipment Systems */}
        <section className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-[#221215] pb-2.5 sm:pb-3 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F1EEEE] tracking-tight">
                Curated Equipment Systems
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-normal">
                Field-tested car accessories for touring, protection, and lighting
              </p>
            </div>
            <Link
              to="/catalogue"
              className="text-xs sm:text-sm font-semibold text-[#FF000E] hover:text-[#E0000C] flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <span>View All</span>
              <i className="bi bi-chevron-right text-[10px] sm:text-xs" aria-hidden="true"></i>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogue?category=${cat.slug}`}
                className="group relative rounded-lg border border-[#221215] hover:border-[#4F242C] bg-[#0E0A0B] overflow-hidden flex flex-col transition-all duration-200"
              >
                <div className="aspect-[16/10] bg-[#0E0A0B] overflow-hidden relative flex items-center justify-center border-b border-[#221215]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#160D0F] via-[#0A0808] to-[#0A0808]" />
                  <img
                    src="/logos/shrell-full_white-text_black-logo.png"
                    alt={cat.name}
                    className="w-36 sm:w-44 max-h-16 object-contain opacity-35 filter brightness-125 grayscale select-none transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-black/80 border border-[#2A1519] px-2 py-0.5 rounded-full text-slate-300">
                      {cat.productCount || 'OEM Grade'}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-[#0E0A0B]">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[#F1EEEE] group-hover:text-[#FF000E] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#FF000E]">
                    <span>Explore category</span>
                    <i className="bi bi-arrow-right text-xs group-hover:translate-x-1 transition-transform" aria-hidden="true"></i>
                  </div>
                </div>
              </Link>
            ))}
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
