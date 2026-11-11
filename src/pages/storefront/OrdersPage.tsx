import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { Order } from '../../domain/types';
import { orderRepository } from '../../infrastructure/repositories';
import { formatINR } from '../../domain/services/CurrencyService';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ProfileOrdersSkeleton } from '../../components/common/ShimmerSkeleton';
import { SEOHead } from '../../infrastructure/seo/SEOHead';

export const OrdersPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED'>('ALL');

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

  // Auth gate
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-16 transition-colors ${
        isDark ? 'bg-[#000000] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
      }`}>
        <SEOHead
          title="My Orders | SHRELL Automotive"
          description="Log in to view your orders and shipments."
          noIndex={true}
        />
        <div className={`max-w-md w-full rounded-2xl border p-8 text-center space-y-6 ${
          isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2] shadow-sm'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            isDark ? 'bg-surface-800 border-surface-700 border text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] border text-[#8E8587]'
          }`}>
            <i className="bi bi-box-seam text-3xl text-[#FF000E]" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
              My Orders &amp; Shipments
            </h1>
            <p className={`text-xs sm:text-sm max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Log in with your verified phone number to view all your past purchases and live courier status.
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Login with Phone
          </button>
          <div className="pt-2">
            <Link to="/catalogue" className="text-xs text-[#FF000E] font-semibold hover:underline">
              ← Return to Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className={`min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-[#000000] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
    }`}>
      <SEOHead
        title="My Orders & Shipments | SHRELL Automotive"
        description="View past orders and live tracking."
        noIndex={true}
      />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header Row */}
        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center group cursor-pointer" aria-label="SHRELL Home">
              <img
                src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
                alt="SHRELL Automotive"
                className={`w-auto object-contain ${isDark ? 'h-[22px]' : 'h-[24px]'}`}
              />
            </Link>
            <span className="text-xs font-mono opacity-40">/</span>
            <span className="text-xs font-mono font-bold text-[#FF000E]">Orders</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              to="/profile"
              className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                isDark ? 'bg-[#120E0F] border-[#261619] text-slate-300 hover:text-white hover:border-[#381B20]' : 'bg-[#FFFFFF] border-[#E0DBD2] text-slate-700 hover:text-black'
              }`}
            >
              <i className="bi bi-person text-xs" />
              <span>Profile</span>
            </Link>
          </div>
        </div>

        {/* Title & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              My Orders &amp; Consignments
            </h1>
            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Review purchase history, rate products, and track dispatch via BlueDart &amp; Delhivery
            </p>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['ALL', 'PENDING', 'SHIPPED', 'DELIVERED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#FF000E] text-white shadow-xs'
                    : isDark
                      ? 'bg-[#120E0F] border border-[#261619] text-slate-400 hover:text-white'
                      : 'bg-[#F5F3EE] border border-[#E0DBD2] text-slate-600 hover:text-black'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Listing */}
        {loadingOrders ? (
          <ProfileOrdersSkeleton />
        ) : filteredOrders.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
          }`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              isDark ? 'bg-[#1A1214] text-slate-400' : 'bg-[#F5F3EE] text-[#5C5456]'
            }`}>
              <i className="bi bi-inbox text-2xl" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                {statusFilter === 'ALL' ? 'No Orders Found' : `No ${statusFilter} Orders`}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                Purchases made under your account or phone will be displayed here automatically.
              </p>
            </div>
            <Link
              to="/catalogue"
              className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === 'DELIVERED';
              const isShipped = order.status === 'SHIPPED';
              const isPending = order.status === 'PENDING';

              const statusColor = isDelivered
                ? isDark ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : isShipped
                  ? isDark ? 'bg-sky-950/70 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-300'
                  : isPending
                    ? isDark ? 'bg-amber-950/70 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-300'
                    : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 sm:p-6 space-y-4 transition-colors ${
                    isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
                  }`}
                >
                  {/* Order Card Header */}
                  <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 ${
                    isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                          Order #{order.id}
                        </span>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-extrabold ${statusColor}`}>
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
                      <div className="text-[11px] text-slate-400 font-mono">Total Amount</div>
                      <div className={`text-base sm:text-lg font-bold font-mono text-[#FF000E]`}>
                        {formatINR(order.totalPaisa)}
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3 py-1">
                    {order.items.map((item, idx) => {
                      const productSlug = item.productName
                        ? item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                        : item.productId;

                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-14 h-14 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center p-1.5 ${
                              isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F9F8F6] border-[#E0DBD2]'
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
                              <div className={`font-semibold truncate text-xs sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {item.productName}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Qty: {item.quantity} • {formatINR(item.unitPricePaisa)} each
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <Link
                              to={`/product/${productSlug}#reviews-section`}
                              className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                                isDark
                                  ? 'border-[#261619] bg-[#1A1214] hover:bg-[#261619] text-amber-400'
                                  : 'border-[#E0DBD2] bg-[#F5F3EE] hover:bg-[#EDE9E1] text-amber-600'
                              }`}
                            >
                              <i className="bi bi-star-fill text-[10px]" />
                              <span>Write Review</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions & Logistics Bar */}
                  <div className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t ${
                    isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                  }`}>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                      <span>Payment:</span>
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {order.paymentMethod}
                      </span>
                      <span>•</span>
                      <span>Delivery:</span>
                      <span className="font-semibold text-[#FF000E]">
                        {order.shipment?.courierName || (order.shippingPaisa === 0 ? 'Free Express Surface' : 'Standard Surface')}
                      </span>
                    </div>

                    <Link
                      to={`/track?id=${order.id}`}
                      className={`text-xs font-mono font-bold px-4 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                        isDark
                          ? 'border-[#261619] bg-[#1A1214] hover:border-[#FF000E] text-white hover:text-[#FF000E]'
                          : 'border-[#E0DBD2] bg-[#FFFFFF] hover:border-[#FF000E] text-slate-900 hover:text-[#FF000E]'
                      }`}
                    >
                      <i className="bi bi-truck text-xs text-[#FF000E]" />
                      <span>Track Consignment</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
