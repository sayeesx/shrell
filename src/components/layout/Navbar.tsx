import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../application/CartContext';

const ANNOUNCEMENT_MESSAGES = [
  { text: 'Fast Surface Dispatch via BlueDart & Delhivery Express Logistics', icon: 'bi-box-seam-fill' },
  { text: 'Verified OEM Equipment Guaranteed', icon: 'bi-patch-check-fill' },
  { text: 'Secure Checkout with UPI & Cards', icon: 'bi-shield-lock-fill' },
  { text: 'Free express courier across India on orders over ₹4,999', icon: 'bi-truck' },
];

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0D0F14] text-white">
      {/* 1. Fluid, Continuous Marquee Loop on Mobile & Desktop (No Stutter, No 3D Cube) */}
      <div className="flex overflow-hidden w-full py-1.5 bg-[#090B0E] border-b border-surface-800/60 text-xs select-none">
        <div className="animate-marquee-scroll flex items-center gap-12 whitespace-nowrap">
          {[...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES].map((msg, i) => (
            <div key={i} className="flex items-center gap-2.5 text-gray-300 font-medium">
              <i className={`bi ${msg.icon} text-brand-400 text-xs`} aria-hidden="true"></i>
              <span className="tracking-tight">{msg.text}</span>
              <span className="text-surface-700 ml-6 text-sm">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Nav — Circle Theme Dark Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-20">
          {/* Logo & Conditional Mobile Back Button (Hidden on homepage) */}
          <div className="flex items-center gap-2.5">
            {!isHomePage && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors"
                aria-label="Go back to previous page"
                title="Go back"
              >
                <i className="bi bi-arrow-left text-base leading-none" aria-hidden="true"></i>
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center lowercase font-sans">
                shrell<span className="w-2.5 h-2.5 rounded-full bg-brand-500 ml-0.5 inline-block"></span>
              </span>
            </Link>
          </div>

          {/* Desktop Giant Pill Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl relative mx-4"
          >
            <div className="relative w-full flex items-center">
              <i
                className="bi bi-search text-gray-400 absolute left-4 text-base pointer-events-none"
                aria-hidden="true"
              ></i>
              <input
                type="text"
                placeholder="What's on your mind? Search accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-900 placeholder:text-gray-500 rounded-full pl-11 pr-11 py-2.5 text-sm font-normal shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
              <button
                type="submit"
                aria-label="Filter or search"
                className="absolute right-3.5 text-gray-500 hover:text-brand-600 transition-colors"
              >
                <i className="bi bi-sliders text-base" aria-hidden="true"></i>
              </button>
            </div>
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link to="/catalogue" className="hover:text-white transition-colors">
              Categories
            </Link>
            <Link to="/catalogue?sort=newest" className="hover:text-white transition-colors">
              Featured
            </Link>
            <Link to="/catalogue" className="hover:text-white transition-colors">
              Deals
            </Link>
            <Link to="/track" className="hover:text-white transition-colors">
              Track Order
            </Link>
          </nav>

          {/* Right Action: Clean Rounded Background Cart Button (Menu, Sell, Sign-in removed) */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-white transition-colors flex items-center justify-center"
              aria-label={`Cart with ${itemCount} items`}
            >
              <i className="bi bi-bag text-lg leading-none" aria-hidden="true"></i>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <i className="bi bi-search text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" aria-hidden="true"></i>
            <input
              type="text"
              placeholder="What's on your mind? Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 placeholder:text-gray-500 rounded-full pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <i className="bi bi-sliders text-sm" aria-hidden="true"></i>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
