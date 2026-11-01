import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Order, Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { orderRepository, productRepository } from '../../infrastructure/repositories';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

export const AdminDashboardOverview: React.FC = () => {
  const { finishPageLoad } = useNavigationLoading();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ordList, prodRes] = await Promise.all([
          orderRepository.getAllOrders(),
          productRepository.getAll({ limit: 100 }),
        ]);
        setOrders(ordList);
        setProducts(prodRes.products);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
        finishPageLoad();
      }
    }
    loadStats();
  }, [finishPageLoad]);

  // Compute live real metrics from database
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalPaisa, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const fulfilledOrders = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'DELIVERED').length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const lowStockProducts = products.filter((p) => p.stockQuantity <= 5);
  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <ShrellLoader size={64} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
          OPERATIONAL OVERVIEW
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Live statistics computed from actual database records • Central Fulfilment Hub
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {formatINR(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {totalOrders} total orders processed
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {totalOrders}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Average: {formatINR(averageOrderValue)} / order
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Pending Dispatch</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-brand-400 tracking-tight">
            {pendingOrders}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Awaiting verification or warehouse packaging
          </div>
        </div>

        {/* Completed / Shipped */}
        <div className="p-5 rounded-lg bg-surface-900 border border-surface-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Fulfilled / In-Transit</span>
            <CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {fulfilledOrders}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Dispatched via BlueDart / Delhivery
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
              Recent Customer Orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs font-mono text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                No orders recorded in database yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-950/60 border-b border-surface-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-850/50">
                      <td className="px-4 py-3 font-bold text-slate-200">
                        <Link to={`/admin/orders?search=${ord.id}`} className="hover:text-brand-400">
                          {ord.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div>{ord.customerName}</div>
                        <div className="text-[10px] text-slate-500">{ord.shippingAddress.city}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-100 font-semibold">
                        {formatINR(ord.totalPaisa)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-brand-950/40 text-brand-300 border border-brand-800">
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">
                        {ord.paymentMethod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-brand-500" />
              Low Stock Alerts
            </h2>
            <Link
              to="/admin/inventory"
              className="text-xs font-mono text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>Restock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-surface-900 border border-surface-700 space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                All catalogue items have healthy inventory levels (&gt; 5 units).
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded bg-surface-950 border border-surface-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="text-slate-200 font-semibold line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-slate-500">SKU: {p.sku}</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800 font-bold">
                      {p.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
