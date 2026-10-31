import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../application/CartContext';
import { useAuth } from '../../application/AuthContext';

const ANNOUNCEMENT_MESSAGES = [
  { text: 'Fast Surface Dispatch via BlueDart & Delhivery Express Logistics', icon: 'bi-box-seam-fill' },
  { text: 'Verified OEM Equipment Guaranteed', icon: 'bi-patch-check-fill' },
  { text: 'Secure Checkout with UPI & Cards', icon: 'bi-shield-lock-fill' },
  { text: 'Free express courier across India on orders over ₹4,999', icon: 'bi-truck' },
];

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
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
      className={`sticky top-0 z-40 text-white transition-all duration-300 ease-in-out ${
        isScrolled
          ? 'bg-[#0D0F14]/95 backdrop-blur-md border-b border-surface-800 shadow-lg'
          : 'bg-[#0D0F14] border-b border-surface-800/40'
      }`}
    >
      {/* 1. Fluid Continuous Marquee (Smoothly collapses and hides on scroll) */}
      <div
        className={`flex overflow-hidden w-full bg-[#090B0E] text-xs select-none transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'max-h-0 opacity-0 py-0 border-b-0 pointer-events-none'
            : 'max-h-10 opacity-100 py-1.5 border-b border-surface-800/60'
        }`}
      >
        <div className="animate-marquee-scroll flex items-center gap-12 whitespace-nowrap">
          {[...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES].map((msg, i) => (
            <div key={i} className="flex items-center gap-2.5 text-gray-300 font-medium font-sans">
              <i className={`bi ${msg.icon} text-brand-400 text-xs`} aria-hidden="true" />
              <span className="tracking-tight">{msg.text}</span>
              <span className="text-surface-700 ml-6 text-sm">•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* DESKTOP NAVBAR (md and up)                                */}
        {/* ========================================================= */}
        <div
          className={`hidden md:flex items-center justify-between gap-4 transition-all duration-300 ${
            isScrolled ? 'h-16' : 'h-20'
          }`}
        >
          {/* Logo & Conditional Mobile Back Button */}
          <div className="flex items-center gap-2.5">
            {!isHomePage && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors"
                aria-label="Go back to previous page"
                title="Go back"
              >
                <i className="bi bi-arrow-left text-base leading-none" aria-hidden="true" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center lowercase font-sans">
                shrell<span className="w-2.5 h-2.5 rounded-full bg-brand-500 ml-0.5 inline-block" />
              </span>
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
                className="w-full bg-white text-gray-900 placeholder:text-gray-500 rounded-full pl-11 pr-11 py-2.5 text-sm font-normal shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans"
              />
              <button
                type="submit"
                aria-label="Filter or search"
                className="absolute right-3.5 text-gray-500 hover:text-brand-600 transition-colors"
              >
                <i className="bi bi-sliders text-base" aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* Desktop Nav Links (Categories, Featured, Deals, Profile) */}
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-300 font-sans">
            <Link to="/catalogue" className="hover:text-white transition-colors">
              Categories
            </Link>
            <Link to="/catalogue?sort=newest" className="hover:text-white transition-colors">
              Featured
            </Link>
            <Link to="/catalogue" className="hover:text-white transition-colors">
              Deals
            </Link>
            <button
              type="button"
              onClick={handleProfileClick}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer"
            >
              <i className="bi bi-person text-base" />
              <span>Profile</span>
            </button>
          </nav>

          {/* Right Action: Clean Rounded Background Cart Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors flex items-center justify-center"
              aria-label={`Cart with ${itemCount} items`}
            >
              <i className="bi bi-bag text-lg leading-none" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE NAVBAR (md:hidden) — Smooth Blended Shift on Scroll */}
        {/* ========================================================= */}
        <div className="md:hidden">
          {isScrolled ? (
            /* Scrolled Blend State: Logo + Search bar + Menu + Cart in single smooth bar */
            <div className="flex items-center justify-between gap-2 h-14 py-2 transition-all duration-300 ease-in-out">
              <Link to="/" className="flex items-center flex-shrink-0">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center lowercase font-sans">
                  shrell<span className="w-2 h-2 rounded-full bg-brand-500 ml-0.5 inline-block" />
                </span>
              </Link>

              {/* Compact Inline Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 relative">
                <i
                  className="bi bi-search text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-gray-900 placeholder:text-gray-500 rounded-full pl-8 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
              </form>

              {/* Menu & Cart Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Link
                  to="/catalogue"
                  className="p-2 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors flex items-center justify-center"
                  title="Categories Menu"
                  aria-label="Categories Menu"
                >
                  <i className="bi bi-grid-fill text-sm leading-none" />
                </Link>
                <Link
                  to="/cart"
                  className="relative p-2 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors flex items-center justify-center"
                  aria-label={`Cart with ${itemCount} items`}
                >
                  <i className="bi bi-bag text-sm leading-none" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none px-0.5">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          ) : (
            /* Unscrolled State: Top Logo row + Menu & Cart, with Search below */
            <div className="py-2.5 space-y-2.5 transition-all duration-300 ease-in-out">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isHomePage && (
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors"
                      aria-label="Go back to previous page"
                    >
                      <i className="bi bi-arrow-left text-base leading-none" />
                    </button>
                  )}
                  <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-2xl font-extrabold tracking-tight text-white flex items-center lowercase font-sans">
                      shrell<span className="w-2.5 h-2.5 rounded-full bg-brand-500 ml-0.5 inline-block" />
                    </span>
                  </Link>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to="/catalogue"
                    className="p-2.5 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors flex items-center justify-center"
                    title="Categories Menu"
                    aria-label="Categories Menu"
                  >
                    <i className="bi bi-grid-fill text-base leading-none" />
                  </Link>
                  <Link
                    to="/cart"
                    className="relative p-2.5 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors flex items-center justify-center"
                    aria-label={`Cart with ${itemCount} items`}
                  >
                    <i className="bi bi-bag text-base leading-none" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Full Width Search Input when unscrolled */}
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
                  className="w-full bg-white text-gray-900 placeholder:text-gray-500 rounded-full pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
                />
                <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <i className="bi bi-sliders text-sm" aria-hidden="true" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
