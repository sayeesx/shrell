import React, { useState, useEffect } from 'react';
import { Order } from '../../domain/types';
import { orderRepository } from '../../infrastructure/repositories';
import { formatINR } from '../../domain/services/CurrencyService';
import { useTheme } from '../../application/ThemeContext';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

export const OrderTrackingPage: React.FC = () => {
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  useEffect(() => {
    finishPageLoad();
  }, [finishPageLoad]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = orderQuery.trim().toUpperCase();
    if (!q) return;

    setLoading(true);
    setError('');

    try {
      let found = await orderRepository.getOrderById(q);
      if (!found) {
        const all = await orderRepository.getAllOrders({ search: q });
        found = all[0] || null;
      }

      setOrder(found);
      if (!found) {
        setError(`No consignment records found matching reference "${q}". Please verify your Order ID.`);
      }
    } catch {
      setError('An error occurred while querying consignment status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
          Track Your Consignment
        </h1>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
          Enter your SHRELL Order Number (e.g. SHR-2026-00101) or AWB Tracking Code
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto">
        <div className={`flex gap-2 p-1.5 rounded-xl border focus-within:border-brand-500 transition-all ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
          <div className={`flex items-center pl-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-[#8E8587]'}`}>
            <i className="bi bi-search text-base" aria-hidden="true"></i>
          </div>
          <input
            type="text"
            placeholder="Enter Order ID (e.g. SHR-2026-001)"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            className={`flex-1 bg-transparent border-none py-2 px-2 text-sm placeholder:text-slate-500 focus:outline-none ${isDark ? 'text-white' : 'text-[#140E10]'}`}
          />
          <button
            type="submit"
            disabled={loading || !orderQuery.trim()}
            className="px-6 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            {loading ? <ShrellLoader size={16} white /> : 'Track'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-semibold text-center max-w-xl mx-auto">
          {error}
        </div>
      )}

      {/* Order Status Display */}
      {order && (
        <div className={`rounded-xl border p-6 sm:p-8 space-y-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
            <div>
              <span className="text-xs text-brand-400 font-bold uppercase tracking-wider font-mono">
                Consignment Details
              </span>
              <h2 className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                Order #{order.id}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-md text-xs font-bold uppercase bg-brand-950/70 text-brand-300 border border-brand-800 font-mono">
                {order.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {[
              { label: 'Customer Name', primary: order.customerName, secondary: order.customerPhone },
              { label: 'Payment Mode', primary: order.paymentMethod, secondary: order.paymentStatus, secondaryClass: 'text-emerald-400 font-semibold' },
              { label: 'Total Consignment Value', primary: formatINR(order.totalPaisa), primaryClass: 'text-brand-400 font-bold text-base', secondary: `${order.items.length} accessory items` },
            ].map((card) => (
              <div key={card.label} className={`p-4 rounded-lg border space-y-1 ${isDark ? 'bg-[#0D0F14] border-surface-800' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
                <div className={`font-medium ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>{card.label}</div>
                <div className={`font-bold text-sm ${card.primaryClass ?? (isDark ? 'text-white' : 'text-[#140E10]')}`}>{card.primary}</div>
                <div className={card.secondaryClass ?? (isDark ? 'text-slate-400' : 'text-[#5C5456]')}>{card.secondary}</div>
              </div>
            ))}
          </div>

          {/* Shipping Address */}
          <div className={`p-4 rounded-lg border text-xs space-y-1 ${isDark ? 'bg-[#0D0F14] border-surface-800' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
            <div className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              <i className="bi bi-geo-alt-fill text-brand-400"></i>
              Destination Address
            </div>
            <div className={`font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} - {order.shippingAddress.postalCode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
