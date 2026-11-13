import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCart } from '../../application/CartContext';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { trackSearchPerformed } from '../../infrastructure/analytics/posthog';

export type CatalogueSortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc';

const SORT_OPTIONS: { value: CatalogueSortOption; label: string }[] = [
  { value: 'relevance', label: 'Best Match / Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Customer Rating (Highest)' },
];

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
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/catalogue') {
      return new URLSearchParams(window.location.search).get('search') || '';
    }
    return '';
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  const [openSortMenu, setOpenSortMenu] = useState<'desktop' | 'mobile' | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopSortRef = useRef<HTMLDivElement>(null);
  const mobileSortRef = useRef<HTMLDivElement>(null);
  const activeSearchInputRef = useRef<'desktop' | 'mobile' | null>(null);

  const rawSort =
    location.pathname === '/catalogue'
      ? new URLSearchParams(location.search).get('sort')
      : null;
  const activeSort: CatalogueSortOption =
    rawSort === 'price-asc' || rawSort === 'price-desc' || rawSort === 'rating-desc'
      ? rawSort
      : 'relevance';

  // Close sort menu on outside click or Escape key
  useEffect(() => {
    if (!openSortMenu) return;

    const handlePointerDown = (e: MouseEvent) => {
      const container = openSortMenu === 'desktop' ? desktopSortRef.current : mobileSortRef.current;
      if (container && !container.contains(e.target as Node)) {
        setOpenSortMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenSortMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openSortMenu]);

  // Sync header search input with URL query when not actively focused in the input
  useEffect(() => {
    const isDesktopFocused = document.activeElement === desktopInputRef.current;
    const isMobileFocused = document.activeElement === mobileInputRef.current;
    if (isDesktopFocused || isMobileFocused) return;

    if (location.pathname === '/catalogue') {
      const urlSearch = new URLSearchParams(location.search).get('search') || '';
      setSearchQuery(urlSearch);
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  // Keep header pinned to the visual viewport top when mobile virtual keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const syncViewport = () => {
      const offset = Math.max(0, Math.round(vv.offsetTop));
      setViewportOffsetTop((prev) => (prev === offset ? prev : offset));
    };

    syncViewport();
    vv.addEventListener('resize', syncViewport);
    vv.addEventListener('scroll', syncViewport);

    return () => {
      vv.removeEventListener('resize', syncViewport);
      vv.removeEventListener('scroll', syncViewport);
    };
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

  const preserveInputFocus = (source: 'desktop' | 'mobile') => {
    const ref = source === 'desktop' ? desktopInputRef : mobileInputRef;
    requestAnimationFrame(() => {
      if (ref.current && document.activeElement !== ref.current) {
        ref.current.focus({ preventScroll: true });
      }
    });
  };

  const handleSearchFocus = (source: 'desktop' | 'mobile') => {
    activeSearchInputRef.current = source;
    const vv = window.visualViewport;
    if (vv) {
      const sync = () => setViewportOffsetTop(Math.max(0, Math.round(vv.offsetTop)));
      sync();
      setTimeout(sync, 80);
      setTimeout(sync, 250);
    }
  };

  const handleSearchInputChange = (value: string, source: 'desktop' | 'mobile') => {
    setSearchQuery(value);
    activeSearchInputRef.current = source;

    if (location.pathname !== '/catalogue') {
      if (value.length > 0) {
        const target = value.trim()
          ? `/catalogue?search=${encodeURIComponent(value)}`
          : '/catalogue';
        navigate(target);
        preserveInputFocus(source);
      }
      return;
    }

    const nextParams = new URLSearchParams(location.search);
    if (value.trim()) {
      nextParams.set('search', value);
    } else {
      nextParams.delete('search');
    }
    const qs = nextParams.toString();
    navigate(`/catalogue${qs ? `?${qs}` : ''}`, { replace: true });
    preserveInputFocus(source);
  };

  const handleClearSearch = (source: 'desktop' | 'mobile') => {
    setSearchQuery('');
    if (location.pathname === '/catalogue') {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('search');
      const qs = nextParams.toString();
      navigate(`/catalogue${qs ? `?${qs}` : ''}`, { replace: true });
    }
    preserveInputFocus(source);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      trackSearchPerformed(trimmed, 0, 'navbar');
      navigate(`/catalogue?search=${encodeURIComponent(trimmed)}`, {
        replace: location.pathname === '/catalogue',
      });
    } else if (location.pathname !== '/catalogue') {
      navigate('/catalogue');
    }
  };

  const handleSelectSort = (sortValue: CatalogueSortOption) => {
    const nextParams = new URLSearchParams(location.pathname === '/catalogue' ? location.search : '');
    if (sortValue === 'relevance') {
      nextParams.delete('sort');
    } else {
      nextParams.set('sort', sortValue);
    }
    if (location.pathname !== '/catalogue' && searchQuery.trim()) {
      nextParams.set('search', searchQuery.trim());
    }
    const qs = nextParams.toString();
    navigate(`/catalogue${qs ? `?${qs}` : ''}`, { replace: location.pathname === '/catalogue' });
    setOpenSortMenu(null);
  };

  const renderSortDropdown = () => (
    <div
      role="menu"
      aria-label="Sort products"
      className={`absolute right-0 top-full mt-2 w-60 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
        isDark
          ? 'bg-[#0E0A0B] border-[#261619] text-[#F1EEEE]'
          : 'bg-white border-[#E0DBD2] text-[#140E10]'
      }`}
    >
      <div className="py-1">
        {SORT_OPTIONS.map((opt) => {
          const isSelected = activeSort === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={isSelected}
              onClick={() => handleSelectSort(opt.value)}
              className={`w-full px-3.5 py-2.5 text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'text-[#FF000E] font-bold bg-[#FF000E]/10'
                  : isDark
                    ? 'hover:bg-white/5 text-[#F1EEEE]'
                    : 'hover:bg-black/5 text-[#140E10]'
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && <i className="bi bi-check2 text-sm text-[#FF000E]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );

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
      style={
        viewportOffsetTop > 0
          ? { transform: `translate3d(0, ${viewportOffsetTop}px, 0)` }
          : undefined
      }
      className={`sticky top-0 z-40 ${
        viewportOffsetTop > 0 ? 'transition-none' : 'transition-all duration-500 ease-in-out'
      } ${
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
            isScrolled ? 'h-[68px]' : 'h-[88px]'
          }`}
        >
          {/* SHRELL Home Logo Button (subtly reduced size) */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group cursor-pointer" aria-label="SHRELL Home">
              <img
                src="/logos/shrell-logo-white.png"
                alt="SHRELL Automotive"
                className="h-[21px] lg:h-[23px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Giant Pill Search Bar — typing auto-opens Categories tab */}
          <div ref={desktopSortRef} className="flex-1 max-w-xl relative mx-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative w-full flex items-center">
                <i
                  className="bi bi-search text-gray-400 absolute left-4 text-base pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={desktopInputRef}
                  type="text"
                  aria-label="Search accessories"
                  placeholder="What's on your mind? Search accessories..."
                  value={searchQuery}
                  onFocus={() => handleSearchFocus('desktop')}
                  onChange={(e) => handleSearchInputChange(e.target.value, 'desktop')}
                  className="w-full rounded-full pl-11 pr-16 py-3 text-sm font-normal shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans bg-white text-gray-900 placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleClearSearch('desktop')}
                    aria-label="Clear search"
                    className="absolute right-10 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1"
                  >
                    <i className="bi bi-x-lg text-sm" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenSortMenu((prev) => (prev === 'desktop' ? null : 'desktop'))}
                  aria-label="Sort products"
                  aria-expanded={openSortMenu === 'desktop'}
                  aria-haspopup="menu"
                  className={`absolute right-3.5 transition-colors cursor-pointer p-1 ${
                    activeSort !== 'relevance' || openSortMenu === 'desktop'
                      ? 'text-[#FF000E]'
                      : 'text-gray-500 hover:text-brand-600'
                  }`}
                >
                  <i className="bi bi-sliders text-base" aria-hidden="true" />
                  {activeSort !== 'relevance' && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF000E]" />
                  )}
                </button>
              </div>
            </form>
            {openSortMenu === 'desktop' && renderSortDropdown()}
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
                <motion.span
                  key={`desktop-badge-${itemCount}`}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute -top-1 -right-1 bg-[#FF000E] text-white text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1 shadow-sm"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE NAVBAR (md:hidden) — Fixed Search Bar & Curved Nav */}
        {/* ========================================================= */}
        <div className="md:hidden py-3.5 transition-all duration-300 ease-in-out">
          {/* Top Row: SHRELL Logo Home Button (subtly reduced size) + Menu & Cart */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0">
              <Link to="/" className="flex items-center flex-shrink-0 group cursor-pointer" aria-label="SHRELL Home">
                <img
                  src="/logos/shrell-logo-white.png"
                  alt="SHRELL Automotive"
                  className="h-[18px] w-auto object-contain"
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
                  <motion.span
                    key={`mobile-badge-${itemCount}`}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 bg-[#FF000E] text-white text-[9px] font-semibold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none px-0.5 shadow-sm"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>

          {/* Search Bar: Persistently fixed and visible on mobile even when keyboard opens */}
          <div ref={mobileSortRef} className="mt-2.5 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <i
                className="bi bi-search text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={mobileInputRef}
                type="text"
                aria-label="Search parts"
                placeholder="What's on your mind? Search parts..."
                value={searchQuery}
                onFocus={() => handleSearchFocus('mobile')}
                onChange={(e) => handleSearchInputChange(e.target.value, 'mobile')}
                className="w-full rounded-full pl-10 pr-16 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans shadow-xs bg-white text-gray-900 placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleClearSearch('mobile')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  aria-label="Clear search"
                >
                  <i className="bi bi-x text-base" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpenSortMenu((prev) => (prev === 'mobile' ? null : 'mobile'))}
                className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 transition-colors ${
                  activeSort !== 'relevance' || openSortMenu === 'mobile'
                    ? 'text-[#FF000E]'
                    : 'text-gray-500 hover:text-brand-600'
                }`}
                aria-label="Sort products"
                aria-expanded={openSortMenu === 'mobile'}
                aria-haspopup="menu"
              >
                <i className="bi bi-sliders text-sm" aria-hidden="true" />
                {activeSort !== 'relevance' && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF000E]" />
                )}
              </button>
            </form>
            {openSortMenu === 'mobile' && renderSortDropdown()}
          </div>
        </div>
      </div>
    </header>
  );
};
