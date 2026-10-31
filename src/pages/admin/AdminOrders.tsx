import React, { useEffect, useState } from 'react';
import { Search, Eye, Check, Truck, X } from 'lucide-react';
import { Order, OrderStatus } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';
import { orderRepository } from '../../infrastructure/repositories';
import { ManualShippingAdapter } from '../../infrastructure/shipping/ManualShippingAdapter';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
            ORDER FULFILMENT & DISPATCH
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage customer consignments, payment verification and courier airway bills
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700 rounded pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
          >
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
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-x-auto shadow-elevation">
        <table className="w-full text-left text-xs font-mono min-w-[760px]">
          <thead className="bg-surface-950/60 border-b border-surface-800 text-slate-400">
            <tr>
              <th className="px-4 py-3">Order Number</th>
              <th className="px-4 py-3">Consignee</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total Payable</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Courier / AWB</th>
              <th className="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No orders match current query filters.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-surface-850/50">
                  <td className="px-4 py-3 font-bold text-slate-100">
                    {ord.id}
                    <div className="text-[10px] text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-semibold">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{ord.paymentMethod}</div>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ord.paymentStatus === 'VERIFIED'
                          ? 'bg-emerald-950/80 text-emerald-300'
                          : 'bg-brand-950/80 text-brand-300'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-100">
                    {formatINR(ord.totalPaisa)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-950 border border-surface-700 text-slate-200">
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {ord.shipment ? (
                      <div>
                        <span className="text-slate-200">{ord.shipment.courierName}</span>
                        <div className="text-slate-500 font-mono">{ord.shipment.trackingNumber}</div>
                      </div>
                    ) : (
                      <span className="text-slate-600">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenOrder(ord)}
                      className="px-3 py-1.5 rounded bg-surface-800 hover:bg-surface-750 text-brand-400 font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-3xl bg-surface-900 border border-surface-700 rounded-lg shadow-elevation overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-400 font-semibold">
                  Order Management
                </span>
                <h2 className="text-base font-bold text-slate-100 font-mono">
                  {selectedOrder.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
              {/* Customer & Address */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded bg-surface-950 border border-surface-800">
                <div>
                  <span className="text-slate-500 uppercase">Consignee</span>
                  <div className="text-slate-200 font-bold mt-0.5">{selectedOrder.customerName}</div>
                  <div className="text-slate-400">Phone: {selectedOrder.customerPhone}</div>
                  <div className="text-slate-400">Email: {selectedOrder.customerEmail}</div>
                </div>

                <div>
                  <span className="text-slate-500 uppercase">Shipping Destination</span>
                  <div className="text-slate-300 mt-0.5">
                    {selectedOrder.shippingAddress.addressLine1}
                    {selectedOrder.shippingAddress.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                  </div>
                  <div className="text-slate-400">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}
                  </div>
                  {selectedOrder.deliveryInstructions && (
                    <div className="text-brand-400/90 text-[11px] mt-1">
                      Note: {selectedOrder.deliveryInstructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Snapshot */}
              <div className="space-y-2">
                <span className="text-slate-400 uppercase font-semibold">Order Items Snapshot</span>
                <div className="border border-surface-800 rounded overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-surface-950 text-slate-400 border-b border-surface-800">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800">
                      {selectedOrder.items.map((i) => (
                        <tr key={i.id} className="bg-surface-900">
                          <td className="px-3 py-2 font-semibold text-slate-200">{i.productName}</td>
                          <td className="px-3 py-2 text-slate-500">{i.sku}</td>
                          <td className="px-3 py-2">{formatINR(i.unitPricePaisa)}</td>
                          <td className="px-3 py-2">{i.quantity}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-100">
                            {formatINR(i.subtotalPaisa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 text-slate-300 space-x-6">
                  <div>Subtotal: {formatINR(selectedOrder.subtotalPaisa)}</div>
                  {selectedOrder.discountPaisa > 0 && (
                    <div className="text-emerald-400">Discount: -{formatINR(selectedOrder.discountPaisa)}</div>
                  )}
                  <div>Shipping: {selectedOrder.shippingPaisa === 0 ? 'FREE' : formatINR(selectedOrder.shippingPaisa)}</div>
                  <div className="text-brand-400 font-bold text-sm">
                    Total: {formatINR(selectedOrder.totalPaisa)}
                  </div>
                </div>
              </div>

              {/* Payment Verification Section */}
              <div className="p-4 rounded bg-surface-950 border border-surface-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 uppercase">Payment Verification</span>
                    <div className="text-slate-200 font-bold mt-0.5">
                      Method: {selectedOrder.paymentMethod} • Status: {selectedOrder.paymentStatus}
                    </div>
                    {selectedOrder.paymentReference && (
                      <div className="text-brand-400 mt-1 font-mono">
                        Customer UTR: <strong>{selectedOrder.paymentReference}</strong>
                      </div>
                    )}
                  </div>

                  {selectedOrder.paymentStatus !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Verified</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dispatch & Carrier Assignment Section */}
              <form onSubmit={handleDispatchShipment} className="p-4 rounded bg-surface-950 border border-surface-800 space-y-3">
                <span className="text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-brand-500" />
                  Courier Airway Bill (AWB) Assignment
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 uppercase mb-1">Carrier Name</label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full bg-surface-900 border border-surface-700 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="BlueDart Express">BlueDart Express</option>
                      <option value="Delhivery Surface">Delhivery Surface</option>
                      <option value="DTDC Priority">DTDC Priority</option>
                      <option value="India Post Speed Post">India Post Speed Post</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 uppercase mb-1">Airway Bill (AWB) Number</label>
                    <input
                      type="text"
                      required
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. BD7891230491"
                      className="w-full bg-surface-900 border border-surface-700 rounded px-2.5 py-1.5 text-slate-100 uppercase"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold uppercase tracking-wider"
                  >
                    Assign AWB & Mark Shipped
                  </button>
                </div>
              </form>

              {/* Status transition dropdown & notes */}
              <div className="p-4 rounded bg-surface-950 border border-surface-800 space-y-3">
                <span className="text-slate-500 uppercase">Change Lifecycle Status</span>
                <div className="flex flex-wrap gap-2">
                  {(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(st)}
                      disabled={selectedOrder.status === st}
                      className={`px-3 py-1.5 rounded font-mono font-semibold transition-colors ${
                        selectedOrder.status === st
                          ? 'bg-brand-500 text-black'
                          : 'bg-surface-900 border border-surface-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
