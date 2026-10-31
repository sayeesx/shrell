import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';

export const MobileNavDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const isCheckout = location.pathname === '/checkout';
  const isAdmin = location.pathname.startsWith('/admin');

  // Do not show on checkout or admin portal
  if (isCheckout || isAdmin) {
    return null;
  }

  const isCategoriesActive =
    location.pathname === '/catalogue' && !location.search.includes('sort=newest');
  const isFeaturedActive =
    location.pathname === '/catalogue' && location.search.includes('sort=newest');
  const isDealsActive =
    location.pathname === '/catalogue' && location.search.includes('deals=true');
  const isProfileActive = location.pathname === '/profile';

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/profile');
    } else {
      openAuthModal();
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0D0F14]/95 backdrop-blur-md border-t border-surface-800/80 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl select-none"
      aria-label="Mobile Navigation Dock"
    >
      <div className="grid grid-cols-4 items-center">
        {/* 1. Categories */}
        <Link
          to="/catalogue"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
            isCategoriesActive ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="bi bi-grid-fill text-lg leading-none" aria-hidden="true" />
          <span className="text-[11px] tracking-tight leading-none">Categories</span>
        </Link>

        {/* 2. Featured */}
        <Link
          to="/catalogue?sort=newest"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
            isFeaturedActive ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="bi bi-stars text-lg leading-none" aria-hidden="true" />
          <span className="text-[11px] tracking-tight leading-none">Featured</span>
        </Link>

        {/* 3. Deals */}
        <Link
          to="/catalogue"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
            isDealsActive ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="bi bi-tag-fill text-lg leading-none" aria-hidden="true" />
          <span className="text-[11px] tracking-tight leading-none">Deals</span>
        </Link>

        {/* 4. Profile (Replaces Track) */}
        <button
          type="button"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
            isProfileActive ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="bi bi-person-fill text-lg leading-none" aria-hidden="true" />
          <span className="text-[11px] tracking-tight leading-none">Profile</span>
        </button>
      </div>
    </nav>
  );
};
