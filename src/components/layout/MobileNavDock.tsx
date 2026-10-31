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
    location.pathname === '/catalogue' &&
    !location.search.includes('sort=newest') &&
    !location.search.includes('deals=true');
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

  const navItems = [
    {
      id: 'categories',
      label: 'Categories',
      to: '/catalogue',
      isActive: isCategoriesActive,
      iconActive: 'bi-grid-fill',
      iconInactive: 'bi-grid',
    },
    {
      id: 'featured',
      label: 'Featured',
      to: '/catalogue?sort=newest',
      isActive: isFeaturedActive,
      iconActive: 'bi-stars',
      iconInactive: 'bi-stars',
    },
    {
      id: 'deals',
      label: 'Deals',
      to: '/catalogue?deals=true',
      isActive: isDealsActive,
      iconActive: 'bi-tag-fill',
      iconInactive: 'bi-tag',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A0C10]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(0,0,0,0.7)] select-none transition-all duration-300"
      aria-label="Mobile Navigation Dock"
    >
      <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
        {/* 1, 2, 3: Categories, Featured, Deals */}
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="group relative flex flex-col items-center justify-center py-1 transition-transform active:scale-90 duration-200 cursor-pointer"
          >
            {/* Animated Active Icon Capsule */}
            <div
              className={`w-12 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                item.isActive
                  ? 'bg-brand-500/15 text-brand-500 shadow-[0_0_14px_rgba(255,0,14,0.35)] -translate-y-1 scale-110'
                  : 'text-gray-400 group-hover:text-white group-hover:scale-105'
              }`}
            >
              <i
                className={`bi ${item.isActive ? item.iconActive : item.iconInactive} text-[23px] leading-none transition-transform`}
                aria-hidden="true"
              />
            </div>

            {/* Label */}
            <span
              className={`text-[10px] tracking-tight transition-all duration-200 ${
                item.isActive
                  ? 'text-white font-bold -translate-y-0.5'
                  : 'text-gray-400 font-medium group-hover:text-gray-200'
              }`}
            >
              {item.label}
            </span>

            {/* Glowing Active Dot */}
            {item.isActive && (
              <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_#FF000E] animate-pulse" />
            )}
          </Link>
        ))}

        {/* 4. Profile / Account */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="group relative flex flex-col items-center justify-center py-1 transition-transform active:scale-90 duration-200 cursor-pointer"
          aria-label="Account profile"
        >
          {/* Animated Active Icon Capsule */}
          <div
            className={`w-12 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isProfileActive
                ? 'bg-brand-500/15 text-brand-500 shadow-[0_0_14px_rgba(255,0,14,0.35)] -translate-y-1 scale-110'
                : 'text-gray-400 group-hover:text-white group-hover:scale-105'
            }`}
          >
            <i
              className={`bi ${isProfileActive ? 'bi-person-fill' : 'bi-person'} text-[23px] leading-none transition-transform`}
              aria-hidden="true"
            />
          </div>

          {/* Label */}
          <span
            className={`text-[10px] tracking-tight transition-all duration-200 ${
              isProfileActive
                ? 'text-white font-bold -translate-y-0.5'
                : 'text-gray-400 font-medium group-hover:text-gray-200'
            }`}
          >
            {user ? 'Account' : 'Login'}
          </span>

          {/* Glowing Active Dot */}
          {isProfileActive && (
            <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_#FF000E] animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
};
