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
import { useTheme } from '../../application/ThemeContext';

export const AdminDashboardOverview: React.FC = () => {
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
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

  const cardCls = `p-5 rounded-lg border space-y-2 ${isDark ? 'bg-surface-900 border-surface-700/80' : 'bg-white border-[#E0DBD2]'}`;
  const labelCls = `text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`;
  const valueCls = `text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`;
  const subCls = `text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
          OPERATIONAL OVERVIEW
        </h1>
        <p className={`text-xs font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
          Live statistics computed from actual database records • Central Fulfilment Hub
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Gross Revenue</span><DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={valueCls}>{formatINR(totalRevenue)}</div>
          <div className={subCls}>{totalOrders} total orders processed</div>
        </div>
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Total Orders</span><ShoppingBag className="w-4 h-4 text-brand-500" />
          </div>
          <div className={valueCls}>{totalOrders}</div>
          <div className={subCls}>Average: {formatINR(averageOrderValue)} / order</div>
        </div>
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Pending Dispatch</span><Clock className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-brand-400 tracking-tight">{pendingOrders}</div>
          <div className={subCls}>Awaiting verification or warehouse packaging</div>
        </div>
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Fulfilled / In-Transit</span><CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className={valueCls}>{fulfilledOrders}</div>
          <div className={subCls}>Dispatched via BlueDart / Delhivery</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
              Recent Customer Orders
            </h2>
            <Link to="/admin/orders" className="text-xs font-mono text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>View All Orders</span><ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
            {recentOrders.length === 0 ? (
              <div className={`p-8 text-center text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                No orders recorded in database yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-surface-950/60 border-surface-800 text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
                  <tr>
                    {['Order ID','Customer','Amount','Status','Payment'].map(h => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-surface-800' : 'divide-[#E0DBD2]'}`}>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className={isDark ? 'hover:bg-surface-850/50' : 'hover:bg-[#F5F3EE]'}>
                      <td className={`px-4 py-3 font-bold ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>
                        <Link to={`/admin/orders?search=${ord.id}`} className="hover:text-brand-400">{ord.id}</Link>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
                        <div>{ord.customerName}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>{ord.shippingAddress.city}</div>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>{formatINR(ord.totalPaisa)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-brand-950/40 text-brand-300 border border-brand-800">{ord.status}</span>
                      </td>
                      <td className={`px-4 py-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>{ord.paymentMethod}</td>
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
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
              <AlertTriangle className="w-4 h-4 text-brand-500" />
              Low Stock Alerts
            </h2>
            <Link to="/admin/inventory" className="text-xs font-mono text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>Restock</span><ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className={`p-4 rounded-lg border space-y-3 ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
            {lowStockProducts.length === 0 ? (
              <div className={`p-4 text-center text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                All catalogue items have healthy inventory levels (&gt; 5 units).
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className={`p-3 rounded border flex items-center justify-between text-xs font-mono ${isDark ? 'bg-surface-950 border-surface-800' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
                    <div>
                      <div className={`font-semibold line-clamp-1 ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>{p.name}</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>SKU: {p.sku}</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800 font-bold">{p.stockQuantity} left</span>
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

