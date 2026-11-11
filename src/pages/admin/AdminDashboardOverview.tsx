import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const cardCls = `p-5 rounded-xl border space-y-2 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`;
  const labelCls = `text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`;
  const valueCls = `text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`;
  const subCls = `text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          OPERATIONAL OVERVIEW
        </h1>
        <p className={`text-xs font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Live statistics computed from actual database records • Central Fulfilment Hub
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Gross Revenue</span>
            <i className="bi bi-currency-rupee text-emerald-500 text-base" aria-hidden="true" />
          </div>
          <div className={valueCls}>{formatINR(totalRevenue)}</div>
          <div className={subCls}>{totalOrders} total orders processed</div>
        </div>
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Total Orders</span>
            <i className="bi bi-bag-check text-slate-500 dark:text-slate-400 text-base" aria-hidden="true" />
          </div>
          <div className={valueCls}>{totalOrders}</div>
          <div className={subCls}>Average: {formatINR(averageOrderValue)} / order</div>
        </div>
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Pending Dispatch</span>
            <i className="bi bi-clock-history text-amber-500 text-base" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 tracking-tight">{pendingOrders}</div>
          <div className={subCls}>Awaiting verification or warehouse packaging</div>
        </div>
        <div className={cardCls}>
          <div className={`flex items-center justify-between ${labelCls}`}>
            <span>Fulfilled / In-Transit</span>
            <i className="bi bi-check-circle text-cyan-500 text-base" aria-hidden="true" />
          </div>
          <div className={valueCls}>{fulfilledOrders}</div>
          <div className={subCls}>Dispatched via BlueDart / Delhivery</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recent Customer Orders
            </h2>
            <Link to="/admin/orders" className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
              <span>View All Orders</span>
              <i className="bi bi-arrow-right text-xs" aria-hidden="true" />
            </Link>
          </div>

          <div className={`border rounded-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            {recentOrders.length === 0 ? (
              <div className={`p-8 text-center text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No orders recorded in database yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <tr>
                    {['Order ID','Customer','Amount','Status','Payment'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className={isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}>
                      <td className={`px-4 py-3 font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <Link to={`/admin/orders?search=${ord.id}`} className="hover:underline">{ord.id}</Link>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <div>{ord.customerName}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ord.shippingAddress.city}</div>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(ord.totalPaisa)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">{ord.status}</span>
                      </td>
                      <td className={`px-4 py-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ord.paymentMethod}</td>
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
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <i className="bi bi-exclamation-triangle text-amber-500 text-sm" aria-hidden="true" />
              Low Stock Alerts
            </h2>
            <Link to="/admin/inventory" className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
              <span>Restock</span>
              <i className="bi bi-arrow-right text-xs" aria-hidden="true" />
            </Link>
          </div>

          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            {lowStockProducts.length === 0 ? (
              <div className={`p-4 text-center text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                All catalogue items have healthy inventory levels (&gt; 5 units).
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <div className={`font-semibold line-clamp-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{p.name}</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>SKU: {p.sku}</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">{p.stockQuantity} left</span>
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

