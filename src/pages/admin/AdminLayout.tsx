import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Tag,
  Settings,
  LogOut,
  ExternalLink,
  Image,
  Database,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { getRepositoryMode } from '../../infrastructure/repositories';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const repoMode = getRepositoryMode();

  // Route Guard: Redirect to /admin/login if not logged in as admin
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Hero Banners', path: '/admin/banners', icon: Image },
    { name: 'Sanity CMS', path: '/admin/sanity', icon: Sparkles },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Inventory & Movements', path: '/admin/inventory', icon: Layers },
    { name: 'Orders & Fulfilment', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${isDark ? 'bg-surface-950 text-slate-100' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 flex flex-col flex-shrink-0 transition-colors duration-300 ${isDark ? 'bg-surface-900 border-r border-surface-800' : 'bg-[#F5F3EE] border-r border-[#E0DBD2]'}`}>
        {/* Brand Header */}
        <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border p-1 flex items-center justify-center flex-shrink-0 shadow-xs ${isDark ? 'bg-surface-950 border-surface-700/80' : 'bg-white border-[#E0DBD2]'}`}>
              <img
                src={isDark ? '/logos/shrell-brandicon_no-bg.png' : '/logos/shrell-blacktext-redlogo.png.png'}
                alt="SHRELL"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className={`text-sm font-bold font-mono tracking-wider ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                SHRELL ADMIN
              </span>
              <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Operations Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-surface-800 text-slate-400 hover:text-brand-400' : 'hover:bg-[#EDE9E1] text-[#5C5456] hover:text-[#FF000E]'}`}
              title="Open Customer Storefront"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Database Mode Badge */}
        <div className={`px-5 py-2.5 flex items-center gap-2 text-[11px] font-mono border-b ${isDark ? 'bg-surface-950/60 border-surface-800/80' : 'bg-[#EDE9E1] border-[#E0DBD2]/80'}`}>
          <Database className="w-3.5 h-3.5 text-brand-500" />
          <span className={isDark ? 'text-slate-400' : 'text-[#5C5456]'}>Database:</span>
          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>{repoMode}</span>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-brand-950/40 text-brand-300 border border-brand-800/60'
                      : 'bg-[#FFE0E2] text-[#B0000A] border border-[#FFB3B7]'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
                      : 'text-[#5C5456] hover:text-[#140E10] hover:bg-[#EDE9E1]'
                }`}
              >
                <item.icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-surface-800 bg-surface-950/40' : 'border-[#E0DBD2] bg-[#EDE9E1]/40'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-brand-400 text-xs font-mono font-bold flex-shrink-0 ${isDark ? 'bg-surface-800' : 'bg-[#EDE9E1] border border-[#E0DBD2]'}`}>
              AD
            </div>
            <div className="truncate">
              <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>{user?.name}</div>
              <div className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-surface-800 text-slate-400 hover:text-rose-400' : 'hover:bg-[#EDE9E1] text-[#5C5456] hover:text-rose-500'}`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Administrative View Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};
