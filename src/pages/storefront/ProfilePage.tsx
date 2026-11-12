import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { Order } from '../../domain/types';
import { orderRepository } from '../../infrastructure/repositories';
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import { CustomerOrdersPanel } from './OrdersPage';

type ProfileTab = 'overview' | 'orders';

export const ProfilePage: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: ProfileTab = rawTab === 'orders' ? 'orders' : 'overview';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  const handleTabChange = (tab: ProfileTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchOrders() {
      if (!user) {
        setLoadingOrders(false);
        finishPageLoad();
        return;
      }
      try {
        setLoadingOrders(true);
        let userOrders = await orderRepository.getOrdersByCustomer(user.id);
        if (userOrders.length === 0 && user.phone) {
          const all = await orderRepository.getAllOrders();
          userOrders = all.filter(
            (o) => o.customerId === user.id || o.customerPhone === user.phone
          );
        }
        setOrders(userOrders);
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoadingOrders(false);
        finishPageLoad();
      }
    }
    fetchOrders();
  }, [user, finishPageLoad]);

  if (!user) {
    return (
      <div className={`min-h-[75vh] flex items-center justify-center px-4 py-16 ${isDark ? 'bg-[#0D0F14]' : 'bg-[#FFFEFA]'}`}>
        <SEOHead
          title="Account Login | SHRELL Automotive"
          description="Log in to view orders, saved addresses, and profile."
          noIndex={true}
        />
        <div className={`max-w-md w-full rounded-2xl border p-8 text-center space-y-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-surface-800 border-surface-700 border text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] border text-[#8E8587]'}`}>
            <i className="bi bi-person text-3xl" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>Your Account</h1>
            <p className={`text-xs sm:text-sm max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Log in with your phone number to access your orders, saved addresses, and profile.
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            Login with Phone
          </button>
          <div className="pt-2">
            <Link to="/catalogue" className="text-xs text-brand-400 font-semibold hover:underline">
              ← Return to Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedPhone = user.phone
    ? user.phone.replace(/(\d{5})(\d{5})/, '$1 $2')
    : '98765 43210';

  return (
    <div className={`min-h-screen py-6 sm:py-10 px-4 sm:px-6 ${isDark ? 'bg-[#0D0F14]' : 'bg-[#FFFEFA]'}`}>
      <SEOHead
        title="My Account | SHRELL Automotive"
        description="Customer profile and order history."
        noIndex={true}
      />
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Navigation Breadcrumb / Home Link */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center group cursor-pointer" aria-label="SHRELL Home">
            <img
              src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
              alt="SHRELL Automotive"
              className={`w-auto object-contain ${isDark ? 'h-[22px]' : 'h-[24px]'}`}
            />
          </Link>
          <span className={`text-[11px] font-bold tracking-wider uppercase font-mono ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>
            Account Management
          </span>
        </div>

        {/* User Profile Card */}
        <div className={`rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'}`}>
          <div className={`w-20 h-20 rounded-full border flex items-center justify-center text-3xl font-bold flex-shrink-0 ${isDark ? 'bg-[#090B0E] border-surface-800 text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
            <i className="bi bi-person-fill" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                +91 {formattedPhone}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold self-center sm:self-auto ${isDark ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                <i className="bi bi-patch-check-fill text-xs" /> Verified Member
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              SHRELL Automotive Indian Customer Account
            </p>
          </div>
        </div>

        {/* Profile Tabs: Overview & My Orders */}
        <div
          role="tablist"
          aria-label="Account sections"
          className={`flex items-center gap-2 p-1 rounded-xl border ${
            isDark ? 'bg-[#0E0A0B] border-surface-800' : 'bg-[#F5F3EE] border-[#E0DBD2]'
          }`}
        >
          <button
            type="button"
            role="tab"
            id="tab-overview"
            aria-selected={activeTab === 'overview'}
            aria-controls="panel-overview"
            onClick={() => handleTabChange('overview')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') handleTabChange('orders');
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#FF000E] text-white shadow-xs'
                : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-[#4A4244] hover:text-[#140E10]'
            }`}
          >
            <i className="bi bi-person-badge text-sm" aria-hidden="true" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-orders"
            aria-selected={activeTab === 'orders'}
            aria-controls="panel-orders"
            onClick={() => handleTabChange('orders')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') handleTabChange('overview');
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-[#FF000E] text-white shadow-xs'
                : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-[#4A4244] hover:text-[#140E10]'
            }`}
          >
            <i className="bi bi-bag-check text-sm" aria-hidden="true" />
            <span>My Orders</span>
            {orders.length > 0 && (
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#FF000E]'
                    : 'bg-[#FF000E] text-white'
                }`}
              >
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'overview' ? (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/track" className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'}`}>
                <i className="bi bi-box-seam text-xl" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-brand-400' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>Track Consignment</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Real-time BlueDart, Delhivery & DTDC tracking.</p>
              </div>
              <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} aria-hidden="true" />
            </Link>

            <Link to="/cart" className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'}`}>
                <i className="bi bi-bag text-xl" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-brand-400' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>Shopping Bag</h2>
                  {itemCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white">{itemCount}</span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Review items, apply promo codes, and checkout.</p>
              </div>
              <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => handleTabChange('orders')}
              className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group cursor-pointer text-left ${
                isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'
              }`}>
                <i className="bi bi-bag-check text-xl" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-brand-400' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>
                    My Orders
                  </h2>
                  {orders.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                      {orders.length}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                  {orders.length > 0 ? `${orders.length} orders placed • View order history` : 'View order history, leave reviews, and track.'}
                </p>
              </div>
              <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} aria-hidden="true" />
            </button>

            <a
              href="https://wa.me/919876543210?text=Hi%20SHRELL%20Automotive%20Team,%20I%20need%20assistance%20with%20my%20account."
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-emerald-300'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
                <i className="bi bi-whatsapp text-xl" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-[#140E10] group-hover:text-emerald-600'}`}>WhatsApp Desk</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Chat directly with technical support.</p>
              </div>
              <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} aria-hidden="true" />
            </a>
          </div>
        ) : (
          <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders">
            <CustomerOrdersPanel orders={orders} loading={loadingOrders} />
          </div>
        )}

        {/* Logout Section */}
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={logout}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${isDark ? 'border-surface-700 bg-surface-900 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800 text-slate-300' : 'border-[#E0DBD2] bg-white hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 text-[#5C5456]'}`}
          >
            <i className="bi bi-box-arrow-right text-sm" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
