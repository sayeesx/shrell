import React, { useEffect, useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import { Coupon } from '../../domain/types';
import { couponRepository } from '../../infrastructure/repositories';
import { formatINR, rupeesToPaisa } from '../../domain/services/CurrencyService';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';

export const AdminCoupons: React.FC = () => {
  const { isDark } = useTheme();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderRupees, setMinOrderRupees] = useState('5000');
  const [maxDiscountRupees] = useState('1500');
  const [maxUses] = useState('500');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useBodyScrollLock(isModalOpen);

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
            PROMOTIONAL COUPONS &amp; OFFERS
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
            Configure percentage and fixed discount vouchers with minimum order thresholds
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className={`border rounded-lg overflow-x-auto ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
        <table className="w-full text-left text-xs font-mono min-w-[650px]">
          <thead className={`border-b ${isDark ? 'bg-surface-950/60 border-surface-800 text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
            <tr>
              {['Coupon Code','Discount Type','Value','Min Order','Usage Count','Status'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-surface-800' : 'divide-[#E0DBD2]'}`}>
            {coupons.map((c) => (
              <tr key={c.id} className={isDark ? 'hover:bg-surface-850/50' : 'hover:bg-[#F5F3EE]'}>
                <td className="px-4 py-3 font-bold text-brand-400 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /><span>{c.code}</span>
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>{c.discountType}</td>
                <td className={`px-4 py-3 font-semibold ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                  {c.discountType === 'PERCENTAGE'
                    ? `${c.discountValue}% (Max ${c.maxDiscountPaisa ? formatINR(c.maxDiscountPaisa) : 'None'})`
                    : formatINR(c.discountValue)}
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>{formatINR(c.minOrderPaisa)}</td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>{c.usedCount} / {c.maxUses}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">ACTIVE</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`relative w-full max-w-md border rounded-lg p-6 space-y-4 ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider border-b pb-2 ${isDark ? 'text-slate-100 border-surface-800' : 'text-[#140E10] border-[#E0DBD2]'}`}>
              Create New Promotion Coupon
            </h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-mono">
              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Coupon Code *</label>
                <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. MONSOON15"
                  className={`w-full border rounded px-3 py-2 uppercase focus:outline-none focus:border-brand-500 ${isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'}`} />
              </div>
              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Discount Type</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'}`}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed INR Amount (₹)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>{discountType === 'PERCENTAGE' ? 'Percentage Value' : 'Rupees Value'} *</label>
                  <input type="number" required min="1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'}`} />
                </div>
                <div>
                  <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Min Order (INR) *</label>
                  <input type="number" required value={minOrderRupees} onChange={(e) => setMinOrderRupees(e.target.value)}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'}`} />
                </div>
              </div>
              <div className={`pt-2 flex justify-end gap-3 border-t ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-[#5C5456] hover:text-[#140E10]'}`}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-brand-500 hover:bg-brand-600 text-white font-bold uppercase tracking-wider">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
