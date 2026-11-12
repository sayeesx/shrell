import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { useCart } from '../../application/CartContext';
import { ANNOUNCEMENT_MESSAGES } from './Navbar';

export const MobileNavDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { isDark } = useTheme();
  const { itemCount } = useCart();
  const navRef = useRef<HTMLElement>(null);

  const isAdmin = location.pathname.startsWith('/admin');

  // Keep --mobile-dock-height synced to the exact rendered dock height so Cart CTA sits flush above the text carousel
  useEffect(() => {
    if (isAdmin) {
      document.documentElement.style.removeProperty('--mobile-dock-height');
      return;
    }

    const updateHeight = () => {
      if (navRef.current) {
        const height = navRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--mobile-dock-height', `${height}px`);
      }
    };

    updateHeight();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && navRef.current) {
      observer = new ResizeObserver(updateHeight);
      observer.observe(navRef.current);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.removeProperty('--mobile-dock-height');
    };
  }, [isAdmin]);

  // Show dock nav for storefront pages including checkout, cart, and delivery address.
  // Only hide on the dedicated admin portal.
  if (isAdmin) {
    return null;
  }

  const isHomeActive = location.pathname === '/';
  const isCategoriesActive = location.pathname.startsWith('/catalogue');
  const isCartActive = location.pathname === '/cart' || location.pathname.startsWith('/checkout');
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
      id: 'cart',
      label: 'Cart',
      to: '/cart',
      isActive: isCartActive,
      iconActive: 'bi-bag-fill',
      iconInactive: 'bi-bag',
      badge: itemCount,
    },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl border-t select-none transition-all duration-300 ${
        isDark
          ? 'bg-[#0A0808]/95 border-[#221215] shadow-[0_-10px_35px_rgba(0,0,0,0.85)]'
          : 'bg-white/95 border-[#E0DBD2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
      }`}
      aria-label="Mobile Navigation Dock"
    >
      {/* Mobile Continuous Text Carousel Loop (Above the Dock Navbar) */}
      <div className={`overflow-hidden border-b h-5 flex items-center text-[10px] md:bg-black ${isDark ? 'bg-[#080000] border-[#221215]/80' : 'bg-[#F5F3EE] border-[#E0DBD2]/80'}`}>
        <div className="animate-marquee-scroll flex items-center gap-6 whitespace-nowrap">
          {[...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES].map((msg, i) => (
            <div key={i} className={`flex items-center gap-1.5 font-medium font-sans leading-none ${isDark ? 'text-gray-300' : 'text-[#5C5456]'}`}>
              <i className={`bi ${msg.icon} text-[#FF000E] text-[9px]`} aria-hidden="true" />
              <span className="tracking-tight">{msg.text}</span>
              <span className={`ml-3 text-[10px] ${isDark ? 'text-[#3B1A1E]' : 'text-[#D6D0C7]'}`}>•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
        {/* 1, 2, 3: Categories, Featured, Deals */}
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="group relative flex flex-col items-center justify-center py-0.5 transition-transform active:scale-95 duration-200 cursor-pointer"
          >
            <div className="w-10 h-6 flex items-center justify-center transition-all duration-200 relative">
              <i
                className={`bi ${item.isActive ? item.iconActive : item.iconInactive} text-[18px] leading-none transition-colors ${
                  item.isActive
                    ? isDark
                      ? 'text-[#F1EEEE]'
                      : 'text-[#140E10]'
                    : isDark
                      ? 'text-gray-400 group-hover:text-white'
                      : 'text-[#8E8587] group-hover:text-[#140E10]'
                }`}
                aria-hidden="true"
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 right-1 bg-[#FF000E] text-white text-[8.5px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5 leading-none shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[9.5px] tracking-tight leading-none mt-0.5 transition-all duration-200 ${
                item.isActive
                  ? isDark
                    ? 'text-[#F1EEEE] font-semibold'
                    : 'text-[#140E10] font-semibold'
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
          className="group relative flex flex-col items-center justify-center py-0.5 transition-transform active:scale-95 duration-200 cursor-pointer"
          aria-label="Account profile"
        >
          <div className="w-10 h-6 flex items-center justify-center transition-all duration-200">
            <i
              className={`bi ${isProfileActive ? 'bi-person-fill' : 'bi-person'} text-[18px] leading-none transition-colors ${
                isProfileActive
                  ? isDark
                    ? 'text-[#F1EEEE]'
                    : 'text-[#140E10]'
                  : isDark
                    ? 'text-gray-400 group-hover:text-white'
                    : 'text-[#8E8587] group-hover:text-[#140E10]'
              }`}
              aria-hidden="true"
            />
          </div>
          <span
            className={`text-[9.5px] tracking-tight leading-none mt-0.5 transition-all duration-200 ${
              isProfileActive
                ? isDark
                  ? 'text-[#F1EEEE] font-semibold'
                  : 'text-[#140E10] font-semibold'
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
