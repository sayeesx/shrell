import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { SEOHead } from '../../infrastructure/seo/SEOHead';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  // Route Guard: Redirect to /admin/login if not logged in as admin
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: 'bi-speedometer2' },
    { name: 'Home Sections (CMS)', path: '/admin/sections', icon: 'bi-layout-text-window-reverse' },
    { name: 'Categories (CMS)', path: '/admin/categories', icon: 'bi-folder2-open' },
    { name: 'Hero Banners', path: '/admin/banners', icon: 'bi-images' },
    { name: 'Products', path: '/admin/products', icon: 'bi-box-seam' },
    { name: 'Reviews', path: '/admin/reviews', icon: 'bi-star-half' },
    { name: 'Inventory & Movements', path: '/admin/inventory', icon: 'bi-stack' },
    { name: 'Orders & Fulfilment', path: '/admin/orders', icon: 'bi-bag-check' },
    { name: 'Coupons & Promos', path: '/admin/coupons', icon: 'bi-tag' },
    { name: 'Configuration', path: '/admin/configuration', icon: 'bi-sliders2' },
    { name: 'Settings', path: '/admin/settings', icon: 'bi-gear' },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
        isDark ? 'admin-dark-shell bg-[#000000] text-[#F1EEEE]' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <SEOHead
        title="Admin Console | SHRELL Automotive"
        description="Internal administration dashboard."
        noIndex={true}
      />
      {/* Sidebar */}
      <aside
        className={`w-full md:w-64 flex flex-col flex-shrink-0 transition-colors duration-200 ${
          isDark ? 'bg-[#0A0A0A] border-b md:border-b-0 md:border-r border-[#222222]' : 'bg-white border-b md:border-b-0 md:border-r border-slate-200'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 md:p-5 flex items-center justify-between border-b ${isDark ? 'border-[#222222]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logos/shrell-brandicon_no-bg.png"
              alt="SHRELL"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className={`text-sm font-bold font-mono tracking-wider whitespace-nowrap block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                SHRELL ADMIN
              </span>
              <div className={`text-[10px] font-mono whitespace-nowrap ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Operations Portal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <ThemeToggle compact />
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-[#141414] text-neutral-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              title="Open Customer Storefront"
            >
              <i className="bi bi-box-arrow-up-right text-xs" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-[#141414] text-white font-semibold border border-[#2B2B2B]'
                      : 'bg-slate-100 text-slate-900 font-semibold border border-slate-200 shadow-xs'
                    : isDark
                      ? 'text-neutral-400 hover:text-neutral-100 hover:bg-[#101010]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <i className={`bi ${item.icon} text-sm flex-shrink-0`} aria-hidden="true" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-[#222222] bg-[#050505]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${isDark ? 'bg-[#181818] text-neutral-200 border border-[#2B2B2B]' : 'bg-slate-200 text-slate-800 border border-slate-300'}`}>
              AD
            </div>
            <div className="truncate">
              <div className={`text-xs font-semibold truncate ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>{user?.name || 'Administrator'}</div>
              <div className={`text-[10px] font-mono truncate ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{user?.email || 'admin@shrell.com'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#141414] text-neutral-400 hover:text-rose-400' : 'hover:bg-slate-200 text-slate-500 hover:text-rose-600'
            }`}
            title="Sign Out"
          >
            <i className="bi bi-box-arrow-right text-sm" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main Administrative View Area */}
      <main className={`flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 md:p-8 transition-colors duration-200 ${isDark ? 'bg-[#000000]' : 'bg-slate-50'}`}>
        <Outlet />
      </main>
    </div>
  );
};
