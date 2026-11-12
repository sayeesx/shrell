import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
      const list = await (couponRepository.getAll ? couponRepository.getAll() : (couponRepository as any).getAllCoupons());
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            PROMOTIONAL COUPONS &amp; OFFERS
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Configure percentage and fixed discount vouchers with minimum order thresholds
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <i className="bi bi-plus-lg text-sm" aria-hidden="true" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <table className="w-full text-left text-xs font-mono min-w-[650px]">
          <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <tr>
              {['Coupon Code','Discount Type','Value','Min Order','Usage Count','Status'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {coupons.map((c) => (
              <tr key={c.id} className={isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}>
                <td className={`px-4 py-3 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <i className="bi bi-tag text-xs text-slate-400" aria-hidden="true" />
                  <span>{c.code}</span>
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.discountType}</td>
                <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {c.discountType === 'PERCENTAGE'
                    ? `${c.discountValue}% (Max ${c.maxDiscountPaisa ? formatINR(c.maxDiscountPaisa) : 'None'})`
                    : formatINR(c.discountValue)}
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatINR(c.minOrderPaisa)}</td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.usedCount} / {c.maxUses}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">ACTIVE</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          {/* Dedicated Fullscreen Frosted Backdrop Layer (zero background bleed) */}
          <div
            className="fixed inset-0 modal-backdrop-solid"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Centered Modal Card (3/4 window adaptive size) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 admin-modal-panel border rounded-xl shadow-2xl p-6 space-y-4 overflow-y-auto my-auto ${isDark ? 'admin-modal-dark bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider border-b pb-2 ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
              Create New Promotion Coupon
            </h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-mono">
              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Coupon Code *</label>
                <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. MONSOON15"
                  className={`w-full border rounded-lg px-3 py-2 uppercase transition-colors focus:outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'}`} />
              </div>
              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Discount Type</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'}`}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed INR Amount (₹)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{discountType === 'PERCENTAGE' ? 'Percentage Value' : 'Rupees Value'} *</label>
                  <input type="number" required min="1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'}`} />
                </div>
                <div>
                  <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Min Order (INR) *</label>
                  <input type="number" required value={minOrderRupees} onChange={(e) => setMinOrderRupees(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'}`} />
                </div>
              </div>
              <div className={`pt-2 flex justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
