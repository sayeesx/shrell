import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderStatus } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { orderRepository } from '../../infrastructure/repositories';
import { ManualShippingAdapter } from '../../infrastructure/shipping/ManualShippingAdapter';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';

export const AdminOrders: React.FC = () => {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useBodyScrollLock(!!selectedOrder);

  // Dispatch fields
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const loadOrders = async () => {
    try {
      const list = await orderRepository.getAllOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        search: search || undefined,
      });
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter, search]);

  const handleOpenOrder = (o: Order) => {
    setSelectedOrder(o);
    setCourierName(o.shipment?.courierName || 'BlueDart Express');
    setTrackingNumber(o.shipment?.trackingNumber || '');
    setTrackingUrl(o.shipment?.trackingUrl || '');
    setInternalNote('');
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await orderRepository.updatePaymentStatus(
        selectedOrder.id,
        'VERIFIED',
        selectedOrder.paymentReference
      );
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      console.error('Failed to verify payment:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      const updated = await orderRepository.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        internalNote || undefined
      );
      setSelectedOrder(updated);
      setInternalNote('');
      loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDispatchShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingNumber.trim()) return;

    try {
      const shippingAdapter = new ManualShippingAdapter();
      const shipment = await shippingAdapter.createShipment(
        selectedOrder.id,
        courierName,
        trackingNumber.trim(),
        trackingUrl.trim() || undefined
      );

      const updated = await orderRepository.updateShipment(selectedOrder.id, shipment);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      console.error('Failed to dispatch shipment:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ORDER FULFILMENT &amp; DISPATCH
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage customer consignments, payment verification and courier airway bills
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <i className={`bi bi-search text-xs absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
            }`}
          />
        </div>
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-slate-500' : 'bg-white border-slate-200 text-slate-900 focus:border-slate-800'
            }`}>
            <option value="">All Order Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-slate-500' : 'bg-white border-slate-200 text-slate-900 focus:border-slate-800'
            }`}>
            <option value="">All Payment Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <table className="w-full text-left text-xs font-mono min-w-[760px]">
          <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <tr>
              {['Order Number','Consignee','Payment','Total Payable','Status','Courier / AWB','Inspect'].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-semibold${i === 6 ? ' text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-4 py-8 text-center font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No orders match current query filters.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id} className={isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}>
                  <td className={`px-4 py-3 font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {ord.id}
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{ord.customerName}</div>
                    <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ord.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>{ord.paymentMethod}</div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.paymentStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(ord.totalPaisa)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {ord.shipment ? (
                      <div>
                        <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{ord.shipment.courierName}</span>
                        <div className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ord.shipment.trackingNumber}</div>
                      </div>
                    ) : (
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenOrder(ord)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <i className="bi bi-eye text-xs" aria-hidden="true" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect & Dispatch Modal */}
      {selectedOrder && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          {/* Dedicated Fullscreen Frosted Backdrop Layer (zero background bleed) */}
          <div
            className="fixed inset-0 modal-backdrop-solid"
            onClick={() => setSelectedOrder(null)}
            aria-hidden="true"
          />

          {/* Centered Modal Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 w-full max-w-3xl border rounded-xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl my-auto ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Order Management</span>
                <h2 className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedOrder.id}</h2>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className={`p-1 rounded-lg transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <i className="bi bi-x-lg text-xs" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
              {/* Customer & Address */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>CONSIGNEE</span>
                  <div className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedOrder.customerName}</div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>Phone: {selectedOrder.customerPhone}</div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>Email: {selectedOrder.customerEmail}</div>
                </div>
                <div>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>SHIPPING DESTINATION</span>
                  <div className={`mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {selectedOrder.shippingAddress.addressLine1}
                    {selectedOrder.shippingAddress.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}
                  </div>
                  {selectedOrder.deliveryInstructions && (
                    <div className="text-slate-400 text-[11px] mt-1">Note: {selectedOrder.deliveryInstructions}</div>
                  )}
                </div>
              </div>

              {/* Items Snapshot */}
              <div className="space-y-2">
                <span className={`uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Order Items Snapshot</span>
                <div className={`border rounded-lg overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <table className="w-full text-left">
                    <thead className={`border-b ${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      <tr>
                        {['Item','SKU','Unit Price','Qty','Subtotal'].map((h,i) => (
                          <th key={h} className={`px-3 py-2 font-semibold${i===4?' text-right':''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {selectedOrder.items.map((i) => (
                        <tr key={i.id} className={isDark ? 'bg-slate-900' : 'bg-white'}>
                          <td className={`px-3 py-2 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{i.productName}</td>
                          <td className={`px-3 py-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{i.sku}</td>
                          <td className={`px-3 py-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatINR(i.unitPricePaisa)}</td>
                          <td className={`px-3 py-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{i.quantity}</td>
                          <td className={`px-3 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(i.subtotalPaisa)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`flex justify-end pt-2 space-x-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div>Subtotal: {formatINR(selectedOrder.subtotalPaisa)}</div>
                  {selectedOrder.discountPaisa > 0 && <div className="text-emerald-500 font-semibold">Discount: -{formatINR(selectedOrder.discountPaisa)}</div>}
                  <div>Shipping: {selectedOrder.shippingPaisa === 0 ? 'FREE' : formatINR(selectedOrder.shippingPaisa)}</div>
                  <div className="font-bold text-sm">Total: {formatINR(selectedOrder.totalPaisa)}</div>
                </div>
              </div>

              {/* Payment Verification Section */}
              <div className={`p-4 rounded-lg border space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>PAYMENT VERIFICATION</span>
                    <div className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Method: {selectedOrder.paymentMethod} • Status: {selectedOrder.paymentStatus}
                    </div>
                    {selectedOrder.paymentReference && (
                      <div className="mt-1 font-mono text-slate-300 dark:text-slate-200">
                        Customer UTR: <strong>{selectedOrder.paymentReference}</strong>
                      </div>
                    )}
                  </div>

                  {selectedOrder.paymentStatus !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <i className="bi bi-check-lg text-sm" aria-hidden="true" />
                      <span>Confirm Verified</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dispatch & Carrier Assignment Section */}
              <form onSubmit={handleDispatchShipment} className={`p-4 rounded-lg border space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`uppercase font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <i className="bi bi-truck text-sm" aria-hidden="true" />
                  Courier Airway Bill (AWB) Assignment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Carrier Name</label>
                    <select value={courierName} onChange={(e) => setCourierName(e.target.value)}
                      className={`w-full border rounded-lg px-2.5 py-1.5 focus:outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'}`}>
                      <option value="BlueDart Express">BlueDart Express</option>
                      <option value="Delhivery Surface">Delhivery Surface</option>
                      <option value="DTDC Priority">DTDC Priority</option>
                      <option value="India Post Speed Post">India Post Speed Post</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Airway Bill (AWB) Number</label>
                    <input type="text" required value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. BD7891230491"
                      className={`w-full border rounded-lg px-2.5 py-1.5 uppercase focus:outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-slate-500' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'}`} />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm">
                    Assign AWB &amp; Mark Shipped
                  </button>
                </div>
              </form>

              {/* Status transition buttons */}
              <div className={`p-4 rounded-lg border space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Change Lifecycle Status</span>
                <div className="flex flex-wrap gap-2">
                  {(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                    <button key={st} type="button" onClick={() => handleUpdateStatus(st)} disabled={selectedOrder.status === st}
                      className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-colors cursor-pointer ${
                        selectedOrder.status === st
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : isDark
                            ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
