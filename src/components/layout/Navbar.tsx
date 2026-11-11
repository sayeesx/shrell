import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { useAuth } from '../../application/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Product } from '../../domain/types';
import { productRepository } from '../../infrastructure/repositories';
import { searchProductsWithFuse } from '../../infrastructure/search/searchService';
import { formatINR } from '../../domain/services/CurrencyService';
import { trackSearchPerformed } from '../../infrastructure/analytics/posthog';
import { useTheme } from '../../application/ThemeContext';
export const ANNOUNCEMENT_MESSAGES = [
  { text: 'Fast Surface Dispatch via BlueDart & Delhivery Express Logistics', icon: 'bi-box-seam-fill' },
  { text: 'Verified OEM Equipment Guaranteed', icon: 'bi-patch-check-fill' },
  { text: 'Secure Checkout with UPI & Cards', icon: 'bi-shield-lock-fill' },
  { text: 'Free express courier across India on orders over ₹300', icon: 'bi-truck' },
];

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load products for instant client-side Fuse.js fuzzy indexing
  useEffect(() => {
    let isMounted = true;
    productRepository
      .getAll({ limit: 100 })
      .then((res) => {
        if (isMounted) setAllProducts(res.products);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  // Instant typo-tolerant Fuse.js search on query change
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const matches = searchProductsWithFuse(allProducts, trimmed, { limit: 5 });
    setSearchResults(matches);
    setIsDropdownOpen(true);
  }, [searchQuery, allProducts]);

  // Click outside to close search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth scroll listener with hysteresis to avoid boundary jitter/stutter
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Hysteresis: hide marquee after 60px; bring back only when scrolled back near top (<24px)
          setIsScrolled((prev) => {
            if (!prev && scrollY > 60) return true;
            if (prev && scrollY < 24) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackSearchPerformed(searchQuery.trim(), searchResults.length, 'navbar');
      setIsDropdownOpen(false);
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    navigate(`/product/${slug}`);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/profile');
    } else {
      openAuthModal();
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-in-out ${
        isScrolled
          ? 'bg-[#0A0808]/95 backdrop-blur-md border-b border-[#221215] shadow-xl rounded-b-[32px] text-white'
          : 'bg-[#0A0808] border-b border-[#221215]/60 text-white'
      }`}
    >
      {/* 1. Fluid Continuous Marquee (Desktop Only - Stays on top, does not hide when scrolling) */}
      <div className="hidden md:block overflow-hidden py-1.5 text-xs select-none bg-black">
        <div className="animate-marquee-scroll flex items-center gap-12 whitespace-nowrap">
          {[
            ...ANNOUNCEMENT_MESSAGES,
            ...ANNOUNCEMENT_MESSAGES,
            ...ANNOUNCEMENT_MESSAGES,
            ...ANNOUNCEMENT_MESSAGES,
          ].map((msg, i) => (
            <div key={i} className="flex items-center gap-2.5 font-medium font-sans shrink-0 text-gray-300">
              <i className={`bi ${msg.icon} text-[#FF000E] text-xs`} aria-hidden="true" />
              <span className="tracking-tight">{msg.text}</span>
              <span className="ml-6 text-sm text-gray-600">•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* DESKTOP NAVBAR (md and up)                                */}
        {/* ========================================================= */}
        <div
          className={`hidden md:flex items-center justify-between gap-4 transition-all duration-500 ease-in-out ${
            isScrolled ? 'h-16' : 'h-20'
          }`}
        >
          {/* SHRELL Home Logo Button (subtly reduced size) */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group cursor-pointer" aria-label="SHRELL Home">
              <img
                src="/logos/shrell-logo-white.png"
                alt="SHRELL Automotive"
                className="h-[25px] lg:h-[27px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Giant Pill Search Bar with Fuse.js Instant Results */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative mx-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative w-full flex items-center">
                <i
                  className="bi bi-search text-gray-400 absolute left-4 text-base pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="What's on your mind? Search accessories..."
                  value={searchQuery}
                  onFocus={() => searchQuery.trim() && setIsDropdownOpen(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full pl-11 pr-11 py-2.5 text-sm font-normal shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans bg-white text-gray-900 placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  aria-label="Filter or search"
                  className="absolute right-3.5 text-gray-500 hover:text-brand-600 transition-colors cursor-pointer"
                >
                  <i className="bi bi-sliders text-base" aria-hidden="true" />
                </button>
              </div>
            </form>

            {/* Instant Typo-Tolerant Search Dropdown (Fuse.js) */}
            {isDropdownOpen && searchQuery.trim() && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 ${
                  isDark
                    ? 'bg-[#0E0A0B]/95 border-[#261619] text-[#F1EEEE]'
                    : 'bg-white/95 border-[#E0DBD2] text-[#140E10]'
                }`}
              >
                <div
                  className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
                    isDark ? 'border-[#261619] text-gray-400' : 'border-[#E0DBD2] text-gray-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <i className="bi bi-lightning-charge-fill text-[#FF000E]" />
                    <span>Instant Results</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-[#FF000E] border border-red-500/20">
                    Typo-Tolerant (Fuse.js)
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-[#261619]/60">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        className={`p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ${
                            isDark ? 'bg-black/40 border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                          }`}
                        >
                          <img
                            src={product.images[0]?.url || '/logos/shrell-brandicon_no-bg.png'}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold truncate leading-snug">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono">
                            <span className="text-[#FF000E] font-bold">
                              {formatINR(product.pricePaisa)}
                            </span>
                            {product.categoryName && (
                              <span
                                className={`truncate px-1.5 py-0.5 rounded ${
                                  isDark ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-600'
                                }`}
                              >
                                {product.categoryName}
                              </span>
                            )}
                          </div>
                        </div>
                        <i className="bi bi-chevron-right text-xs opacity-40 shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs opacity-60">
                      No matching products for "{searchQuery}". Try a different spelling or part name.
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className={`w-full py-2.5 px-4 text-center text-xs font-bold font-mono transition-colors border-t cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDark
                        ? 'bg-black/40 hover:bg-black/80 border-[#261619] text-[#FF000E]'
                        : 'bg-gray-50 hover:bg-gray-100 border-[#E0DBD2] text-[#FF000E]'
                    }`}
                  >
                    <span>View all matches in Catalogue</span>
                    <i className="bi bi-arrow-right text-[11px]" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Nav Links (Home, Categories, Cart, Profile) */}
          <nav className="flex items-center gap-6 text-sm font-medium font-sans text-gray-300">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/catalogue" className="transition-colors hover:text-white">
              Categories
            </Link>
            <Link to="/cart" className="transition-colors hover:text-white">
              Cart
            </Link>
            <button
              type="button"
              onClick={handleProfileClick}
              className="transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer hover:text-white"
            >
              <i className="bi bi-person text-base" />
              <span>{user ? 'Account' : 'Profile'}</span>
            </button>
          </nav>

          {/* Right Action: Cart + Theme Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <ThemeToggle compact />
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full border text-white transition-colors flex items-center justify-center active:scale-95 cursor-pointer bg-[#130E10] hover:bg-[#1D1214] border-[#221215]"
              aria-label={`Cart with ${itemCount} items`}
            >
              <i className="bi bi-bag text-lg leading-none" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF000E] text-white text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1 shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE NAVBAR (md:hidden) — Fixed Search Bar & Curved Nav */}
        {/* ========================================================= */}
        <div className="md:hidden py-2.5 transition-all duration-300 ease-in-out">
          {/* Top Row: SHRELL Logo Home Button (subtly reduced size) + Menu & Cart */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0">
              <Link to="/" className="flex items-center flex-shrink-0 group cursor-pointer" aria-label="SHRELL Home">
                <img
                  src="/logos/shrell-logo-white.png"
                  alt="SHRELL Automotive"
                  className="h-[21px] w-auto object-contain"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle compact />
              <Link
                to="/cart"
                className="relative p-2 rounded-lg border transition-colors flex items-center justify-center active:scale-95 cursor-pointer bg-[#130E10] hover:bg-[#1D1214] border-[#221215] text-white"
                aria-label={`Cart with ${itemCount} items`}
              >
                <i className="bi bi-bag text-sm leading-none" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF000E] text-white text-[9px] font-semibold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none px-0.5 shadow-sm">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search Bar: Persistently fixed and visible on mobile even when scrolling */}
          <div ref={mobileSearchRef} className="mt-2.5 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <i
                className="bi bi-search text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="What's on your mind? Search parts..."
                value={searchQuery}
                onFocus={() => searchQuery.trim() && setIsDropdownOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans shadow-xs bg-white text-gray-900 placeholder:text-gray-500"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <i className="bi bi-x text-base" />
                </button>
              ) : (
                <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" aria-label="Search filter">
                  <i className="bi bi-sliders text-sm" aria-hidden="true" />
                </button>
              )}
            </form>

            {/* Mobile Instant Typo-Tolerant Search Dropdown (Fuse.js) */}
            {isDropdownOpen && searchQuery.trim() && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 ${
                  isDark
                    ? 'bg-[#0E0A0B]/95 border-[#261619] text-[#F1EEEE]'
                    : 'bg-white/95 border-[#E0DBD2] text-[#140E10]'
                }`}
              >
                <div
                  className={`px-3 py-1.5 border-b flex items-center justify-between text-[10px] font-mono ${
                    isDark ? 'border-[#261619] text-gray-400' : 'border-[#E0DBD2] text-gray-500'
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold uppercase">
                    <i className="bi bi-lightning-charge-fill text-[#FF000E]" />
                    <span>Quick Results</span>
                  </span>
                  <span className="text-[#FF000E]">Fuse.js Fuzzy</span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-[#261619]/60">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        className={`p-2.5 flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ${
                            isDark ? 'bg-black/40 border-[#261619]' : 'bg-[#F5F3EE] border-[#E0DBD2]'
                          }`}
                        >
                          <img
                            src={product.images[0]?.url || '/logos/shrell-brandicon_no-bg.png'}
                            alt={product.name}
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold truncate leading-tight">
                            {product.name}
                          </h4>
                          <span className="text-[11px] font-bold text-[#FF000E] font-mono">
                            {formatINR(product.pricePaisa)}
                          </span>
                        </div>
                        <i className="bi bi-chevron-right text-xs opacity-40 shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs opacity-60">
                      No matching products.
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className={`w-full py-2 px-3 text-center text-[11px] font-bold font-mono transition-colors border-t cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDark
                        ? 'bg-black/40 hover:bg-black/80 border-[#261619] text-[#FF000E]'
                        : 'bg-gray-50 hover:bg-gray-100 border-[#E0DBD2] text-[#FF000E]'
                    }`}
                  >
                    <span>View all in Catalogue</span>
                    <i className="bi bi-arrow-right text-[10px]" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
