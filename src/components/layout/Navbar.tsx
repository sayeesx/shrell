import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../ui/ThemeToggle';
export const ANNOUNCEMENT_MESSAGES = [
  { text: 'Fast Surface Dispatch via BlueDart & Delhivery Express Logistics', icon: 'bi-box-seam-fill' },
  { text: 'Verified OEM Equipment Guaranteed', icon: 'bi-patch-check-fill' },
  { text: 'Secure Checkout with UPI & Cards', icon: 'bi-shield-lock-fill' },
  { text: 'Free express courier across India on orders over ₹4,999', icon: 'bi-truck' },
];

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

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
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
      <div className={`hidden md:block overflow-hidden border-b py-1.5 text-xs select-none transition-colors ${isDark ? 'bg-[#080000] border-[#221215]/60' : 'bg-[#F5F3EE] border-[#E0DBD2]/60'}`}>
        <div className="animate-marquee-scroll flex items-center gap-12 whitespace-nowrap">
          {[
            ...ANNOUNCEMENT_MESSAGES,
            ...ANNOUNCEMENT_MESSAGES,
            ...ANNOUNCEMENT_MESSAGES,
            ...ANNOUNCEMENT_MESSAGES,
          ].map((msg, i) => (
            <div key={i} className={`flex items-center gap-2.5 font-medium font-sans shrink-0 ${isDark ? 'text-gray-300' : 'text-[#5C5456]'}`}>
              <i className={`bi ${msg.icon} text-[#FF000E] text-xs`} aria-hidden="true" />
              <span className="tracking-tight">{msg.text}</span>
              <span className={`ml-6 text-sm ${isDark ? 'text-[#3B1A1E]' : 'text-[#D6D0C7]'}`}>•</span>
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

          {/* Desktop Giant Pill Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative mx-4">
            <div className="relative w-full flex items-center">
              <i
                className="bi bi-search text-gray-400 absolute left-4 text-base pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="What's on your mind? Search accessories..."
                value={searchQuery}
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

          {/* Desktop Nav Links (Home, Categories, Deals, Profile) */}
          <nav className="flex items-center gap-6 text-sm font-medium font-sans text-gray-300">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/catalogue" className="transition-colors hover:text-white">
              Categories
            </Link>
            <Link to="/catalogue?deals=true" className="transition-colors hover:text-white">
              Deals
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
                to="/catalogue"
                className="p-2 rounded-full border transition-colors flex items-center justify-center active:scale-95 cursor-pointer bg-[#130E10] hover:bg-[#1D1214] border-[#221215] text-white"
                title="Categories Menu"
                aria-label="Categories Menu"
              >
                <i className="bi bi-grid-fill text-sm leading-none" />
              </Link>
              <Link
                to="/cart"
                className="relative p-2 rounded-full border transition-colors flex items-center justify-center active:scale-95 cursor-pointer bg-[#130E10] hover:bg-[#1D1214] border-[#221215] text-white"
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
          <div className="mt-2.5">
            <form onSubmit={handleSearchSubmit} className="relative">
              <i
                className="bi bi-search text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="What's on your mind? Search parts..."
                value={searchQuery}
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
          </div>
        </div>
      </div>
    </header>
  );
};
