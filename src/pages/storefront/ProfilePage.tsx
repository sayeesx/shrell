import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { Order } from '../../domain/types';
import { orderRepository } from '../../infrastructure/repositories';
import { formatINR } from '../../domain/services/CurrencyService';
import { ProfileOrdersSkeleton } from '../../components/common/ShimmerSkeleton';

export const ProfilePage: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

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

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/track" className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'}`}>
              <i className="bi bi-box-seam text-xl" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-brand-400' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>Track Consignment</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Real-time BlueDart, Delhivery & DTDC tracking.</p>
            </div>
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </Link>

          <Link to="/cart" className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'}`}>
              <i className="bi bi-bag text-xl" />
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
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </Link>

          <a
            href="#my-orders"
            className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group cursor-pointer ${
              isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'
            }`}>
              <i className="bi bi-bag-check text-xl" />
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
                {orders.length > 0 ? `${orders.length} orders placed • View shipments & reviews` : 'View order history and leave reviews.'}
              </p>
            </div>
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </a>

          <a
            href="https://wa.me/919876543210?text=Hi%20SHRELL%20Automotive%20Team,%20I%20need%20assistance%20with%20my%20account."
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-emerald-300'}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
              <i className="bi bi-whatsapp text-xl" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-[#140E10] group-hover:text-emerald-600'}`}>WhatsApp Desk</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Chat directly with technical support.</p>
            </div>
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </a>
        </div>

        {/* My Orders Section */}
        <div id="my-orders" className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-3 border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <i className="bi bi-box-seam text-base text-[#FF000E]" />
              <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                My Orders &amp; Consignments
              </h2>
            </div>
            {orders.length > 0 && (
              <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                {orders.length} Total Orders
              </span>
            )}
          </div>

          {loadingOrders ? (
            <ProfileOrdersSkeleton />
          ) : orders.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border space-y-3 ${
              isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                isDark ? 'bg-surface-800 text-slate-400' : 'bg-[#F5F3EE] text-[#5C5456]'
              }`}>
                <i className="bi bi-inbox text-xl" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                  No Orders Placed Yet
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                  Your purchases and live BlueDart / Delhivery tracking will appear here.
                </p>
              </div>
              <Link
                to="/catalogue"
                className="inline-block mt-2 px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs transition-colors"
              >
                Browse Catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {orders.map((order) => {
                const isDelivered = order.status === 'DELIVERED';
                const isShipped = order.status === 'SHIPPED';
                const isPending = order.status === 'PENDING';

                const statusColor = isDelivered
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                  : isShipped
                    ? 'bg-sky-950/70 text-sky-400 border-sky-800'
                    : isPending
                      ? 'bg-amber-950/70 text-amber-400 border-amber-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-colors ${
                      isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-black/5 dark:border-white/5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                            #{order.id}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-mono">Total Paid</div>
                        <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                          {formatINR(order.totalPaisa)}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 py-1">
                      {order.items.map((item, idx) => {
                        const productSlug = item.productName
                          ? item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                          : item.productId;

                        return (
                          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-12 h-12 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center p-1 ${
                                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <img
                                  src={item.imageUrl || '/logos/shrell-brandicon_no-bg.png'}
                                  alt={item.productName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/logos/shrell-brandicon_no-bg.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className={`font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {item.productName}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  Qty: {item.quantity} • {formatINR(item.unitPricePaisa)}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <Link
                                to={`/product/${productSlug}#reviews-section`}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                                  isDark ? 'border-surface-700 hover:bg-surface-800 text-amber-400' : 'border-slate-300 hover:bg-slate-100 text-amber-600'
                                }`}
                              >
                                <i className="bi bi-star-fill text-[10px]" />
                                <span>Review</span>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                      <div className="text-[11px] font-mono text-slate-400">
                        Payment: <span className="font-semibold text-slate-200">{order.paymentMethod}</span>
                      </div>
                      <Link
                        to={`/track?id=${order.id}`}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                          isDark ? 'border-surface-700 hover:bg-surface-800 text-white' : 'border-[#E0DBD2] hover:bg-slate-100 text-slate-900'
                        }`}
                      >
                        <i className="bi bi-truck text-xs" />
                        <span>Track Consignment</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
