import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Order } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { ProfileOrdersSkeleton } from '../../components/common/ShimmerSkeleton';
import { useTheme } from '../../application/ThemeContext';

interface CustomerOrdersPanelProps {
  orders: Order[];
  loading: boolean;
}

export const CustomerOrdersPanel: React.FC<CustomerOrdersPanelProps> = ({ orders, loading }) => {
  const { isDark } = useTheme();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED'>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            My Orders &amp; Consignments
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
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
                    ? 'bg-[#120E0F] border border-[#261619] text-slate-300 hover:text-white'
                    : 'bg-[#F5F3EE] border border-[#E0DBD2] text-[#4A4244] hover:text-black'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Listing */}
      {loading ? (
        <ProfileOrdersSkeleton />
      ) : filteredOrders.length === 0 ? (
        <div
          className={`p-10 text-center rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              isDark ? 'bg-[#1A1214] text-slate-400' : 'bg-[#F5F3EE] text-[#5C5456]'
            }`}
          >
            <i className="bi bi-inbox text-2xl" aria-hidden="true" />
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
              ? isDark
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : isShipped
                ? isDark
                  ? 'bg-sky-950/70 text-sky-400 border-sky-800'
                  : 'bg-sky-50 text-sky-700 border-sky-300'
                : isPending
                  ? isDark
                    ? 'bg-amber-950/70 text-amber-400 border-amber-800'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 sm:p-6 space-y-4 transition-colors ${
                  isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
                }`}
              >
                {/* Order Card Header */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 ${
                    isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                        Order #{order.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-extrabold ${statusColor}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                      Placed on{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Total Amount</div>
                    <div className="text-base sm:text-lg font-bold font-mono text-[#FF000E]">
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
                          <div
                            className={`w-14 h-14 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center p-1.5 ${
                              isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-[#F9F8F6] border-[#E0DBD2]'
                            }`}
                          >
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
                            <div className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
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
                                : 'border-[#E0DBD2] bg-[#F5F3EE] hover:bg-[#EDE9E1] text-amber-700'
                            }`}
                          >
                            <i className="bi bi-star-fill text-[10px]" aria-hidden="true" />
                            <span>Write Review</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions & Logistics Bar */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t ${
                    isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                  }`}
                >
                  <div className={`text-[11px] font-mono flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
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
                    <i className="bi bi-truck text-xs text-[#FF000E]" aria-hidden="true" />
                    <span>Track Consignment</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <Navigate to="/profile?tab=orders" replace />;
};
