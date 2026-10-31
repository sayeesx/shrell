import React, { useEffect, useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import { Coupon } from '../../domain/types';
import { couponRepository } from '../../infrastructure/repositories';
import { formatINR, rupeesToPaisa } from '../../domain/services/CurrencyService';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderRupees, setMinOrderRupees] = useState('5000');
  const [maxDiscountRupees] = useState('1500');
  const [maxUses] = useState('500');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCoupons = async () => {
    try {
      const list = await (couponRepository as any).getAllCoupons();
      setCoupons(list);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const val =
      discountType === 'PERCENTAGE'
        ? Number(discountValue)
        : rupeesToPaisa(Number(discountValue));

    const minOrderPaisa = rupeesToPaisa(Number(minOrderRupees));
    const maxDiscountPaisa = maxDiscountRupees ? rupeesToPaisa(Number(maxDiscountRupees)) : undefined;

    try {
      await couponRepository.create({
        code: cleanCode,
        discountType,
        discountValue: val,
        minOrderPaisa,
        maxDiscountPaisa,
        maxUses: Number(maxUses),
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
        isActive: true,
      });
      setIsModalOpen(false);
      setCode('');
      loadCoupons();
    } catch (err) {
      console.error('Failed to create coupon:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
            PROMOTIONAL COUPONS & OFFERS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configure percentage and fixed discount vouchers with minimum order thresholds
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-x-auto shadow-elevation">
        <table className="w-full text-left text-xs font-mono min-w-[650px]">
          <thead className="bg-surface-950/60 border-b border-surface-800 text-slate-400">
            <tr>
              <th className="px-4 py-3">Coupon Code</th>
              <th className="px-4 py-3">Discount Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Usage Count</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-surface-850/50">
                <td className="px-4 py-3 font-bold text-brand-400 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{c.code}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">{c.discountType}</td>
                <td className="px-4 py-3 font-semibold text-slate-100">
                  {c.discountType === 'PERCENTAGE'
                    ? `${c.discountValue}% (Max ${c.maxDiscountPaisa ? formatINR(c.maxDiscountPaisa) : 'None'})`
                    : formatINR(c.discountValue)}
                </td>
                <td className="px-4 py-3 text-slate-400">{formatINR(c.minOrderPaisa)}</td>
                <td className="px-4 py-3 text-slate-300">
                  {c.usedCount} / {c.maxUses}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md bg-surface-900 border border-surface-700 rounded-lg shadow-elevation p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider border-b border-surface-800 pb-2">
              Create New Promotion Coupon
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block uppercase text-slate-400 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MONSOON15"
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 uppercase"
                />
              </div>

              <div>
                <label className="block uppercase text-slate-400 mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed INR Amount (₹)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-slate-400 mb-1">
                    {discountType === 'PERCENTAGE' ? 'Percentage Value' : 'Rupees Value'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1">Min Order (INR) *</label>
                  <input
                    type="number"
                    required
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-surface-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold uppercase tracking-wider"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
