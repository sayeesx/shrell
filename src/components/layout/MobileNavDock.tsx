import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ANNOUNCEMENT_MESSAGES } from './Navbar';

export const MobileNavDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { isDark } = useTheme();

  const isCheckout = location.pathname === '/checkout';
  const isAdmin = location.pathname.startsWith('/admin');

  // Do not show on checkout or admin portal
  if (isCheckout || isAdmin) {
    return null;
  }

  const isHomeActive = location.pathname === '/';
  const isCategoriesActive =
    location.pathname === '/catalogue' &&
    !location.search.includes('deals=true');
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
      id: 'home',
      label: 'Home',
      to: '/',
      isActive: isHomeActive,
      iconActive: 'bi-house-door-fill',
      iconInactive: 'bi-house-door',
    },
    {
      id: 'categories',
      label: 'Categories',
      to: '/catalogue',
      isActive: isCategoriesActive,
      iconActive: 'bi-grid-fill',
      iconInactive: 'bi-grid',
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
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl border-t select-none transition-all duration-300 ${
        isDark
          ? 'bg-[#0A0808]/95 border-[#221215] shadow-[0_-10px_35px_rgba(0,0,0,0.85)]'
          : 'bg-white/95 border-[#E0DBD2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
      }`}
      aria-label="Mobile Navigation Dock"
    >
      {/* Mobile Continuous Text Carousel Loop (Above the Dock Navbar) */}
      <div className={`overflow-hidden border-b py-1 text-[11px] md:bg-black ${isDark ? 'bg-[#080000] border-[#221215]/80' : 'bg-[#F5F3EE] border-[#E0DBD2]/80'}`}>
        <div className="animate-marquee-scroll flex items-center gap-8 whitespace-nowrap">
          {[...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES].map((msg, i) => (
            <div key={i} className={`flex items-center gap-2 font-medium font-sans ${isDark ? 'text-gray-300' : 'text-[#5C5456]'}`}>
              <i className={`bi ${msg.icon} text-[#FF000E] text-[10px]`} aria-hidden="true" />
              <span className="tracking-tight">{msg.text}</span>
              <span className={`ml-4 text-xs ${isDark ? 'text-[#3B1A1E]' : 'text-[#D6D0C7]'}`}>•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pt-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
        {/* 1, 2, 3: Categories, Featured, Deals */}
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="group relative flex flex-col items-center justify-center py-1 transition-transform active:scale-95 duration-200 cursor-pointer"
          >
            <div className="w-12 h-8 flex items-center justify-center transition-all duration-200">
              <i
                className={`bi ${item.isActive ? item.iconActive : item.iconInactive} text-[23px] leading-none transition-colors ${
                  item.isActive
                    ? 'text-[#FF000E]'
                    : isDark
                      ? 'text-gray-400 group-hover:text-white'
                      : 'text-[#8E8587] group-hover:text-[#140E10]'
                }`}
                aria-hidden="true"
              />
            </div>
            <span
              className={`text-[10px] tracking-tight transition-all duration-200 ${
                item.isActive
                  ? 'text-[#FF000E] font-semibold'
                  : isDark
                    ? 'text-gray-400 font-normal group-hover:text-gray-200'
                    : 'text-[#8E8587] font-normal group-hover:text-[#140E10]'
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}

        {/* 4. Profile / Account */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="group relative flex flex-col items-center justify-center py-1 transition-transform active:scale-95 duration-200 cursor-pointer"
          aria-label="Account profile"
        >
          <div className="w-12 h-8 flex items-center justify-center transition-all duration-200">
            <i
              className={`bi ${isProfileActive ? 'bi-person-fill' : 'bi-person'} text-[23px] leading-none transition-colors ${
                isProfileActive
                  ? 'text-[#FF000E]'
                  : isDark
                    ? 'text-gray-400 group-hover:text-white'
                    : 'text-[#8E8587] group-hover:text-[#140E10]'
              }`}
              aria-hidden="true"
            />
          </div>
          <span
            className={`text-[10px] tracking-tight transition-all duration-200 ${
              isProfileActive
                ? 'text-[#FF000E] font-semibold'
                : isDark
                  ? 'text-gray-400 font-normal group-hover:text-gray-200'
                  : 'text-[#8E8587] font-normal group-hover:text-[#140E10]'
            }`}
          >
            {user ? 'Account' : 'Login'}
          </span>
        </button>
      </div>
      </div>
    </nav>
  );
};
