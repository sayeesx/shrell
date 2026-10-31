import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../application/AuthContext';
import { getRepositoryMode } from '../../infrastructure/repositories';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const repoMode = getRepositoryMode();

  // Route Guard: Redirect to /admin/login if not logged in as admin
  if (!isAdmin) {
    navigate('/admin/login');
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Hero Banners', path: '/admin/banners', icon: Image },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Inventory & Movements', path: '/admin/inventory', icon: Layers },
    { name: 'Orders & Fulfilment', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-surface-900 border-r border-surface-800 flex flex-col flex-shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-950 border border-surface-700/80 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
              <img
                src="/logos/shrell-brandicon_no-bg.png"
                alt="SHRELL"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 font-mono tracking-wider">
                SHRELL ADMIN
              </span>
              <div className="text-[10px] text-slate-400 font-mono">Operations Portal</div>
            </div>
          </div>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-surface-800 text-slate-400 hover:text-brand-400"
            title="Open Customer Storefront"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Database Mode Badge */}
        <div className="px-5 py-2.5 bg-surface-950/60 border-b border-surface-800/80 flex items-center gap-2 text-[11px] font-mono">
          <Database className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-slate-400">Database:</span>
          <span className="text-slate-200 font-semibold">{repoMode}</span>
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
                    ? 'bg-brand-950/40 text-brand-300 border border-brand-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
                }`}
              >
                <item.icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-surface-800 bg-surface-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded bg-surface-800 flex items-center justify-center text-brand-400 text-xs font-mono font-bold flex-shrink-0">
              AD
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded hover:bg-surface-800 text-slate-400 hover:text-rose-400 transition-colors"
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
