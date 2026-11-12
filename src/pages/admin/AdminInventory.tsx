import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InventoryMovement, Product } from '../../domain/types';
import { inventoryRepository, productRepository } from '../../infrastructure/repositories';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';

export const AdminInventory: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [search, setSearch] = useState('');

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useBodyScrollLock(!!selectedProduct);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('5');
  const [adjustmentType, setAdjustmentType] = useState<'RESTOCK' | 'DAMAGE_ADJUSTMENT'>('RESTOCK');
  const [adjustmentNotes, setAdjustmentNotes] = useState('Warehouse stock intake');

  const loadData = async () => {
    try {
      const [prodRes, movs] = await Promise.all([
        productRepository.getAll({ limit: 100 }),
        inventoryRepository.getMovements(),
      ]);
      setProducts(prodRes.products);
      setMovements(movs);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(adjustmentQuantity);
    const multiplier = adjustmentType === 'RESTOCK' ? 1 : -1;
    const finalChange = qty * multiplier;

    try {
      await inventoryRepository.adjustStock(
        selectedProduct.id,
        finalChange,
        adjustmentType,
        adjustmentNotes,
        `ADJ-${Date.now()}`
      );
      setSelectedProduct(null);
      loadData();
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          INVENTORY MANAGEMENT &amp; AUDIT TRAIL
        </h1>
        <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Atomic warehouse stock movements, reservation controls and intake records
        </p>
      </div>

      {/* Stock Levels Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className={`text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <i className="bi bi-stack text-sm text-slate-400" aria-hidden="true" />
            Current Warehouse Stock
          </h2>
          <div className="max-w-xs w-full relative">
            <i className={`bi bi-search text-xs absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} aria-hidden="true" />
            <input type="text" placeholder="Filter part or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
              className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono transition-colors focus:outline-none ${
                isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
              }`} />
          </div>
        </div>

        <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left text-xs font-mono min-w-[650px]">
            <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                {['SKU & Item Name','Category','Available On Hand','Threshold Status','Adjustment'].map((h,i) => (
                  <th key={h} className={`px-4 py-3 font-semibold${i===4?' text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {filteredProducts.map((p) => (
                <tr key={p.id} className={isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{p.name}</span>
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{p.sku}</div>
                  </td>
                  <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.categoryName || 'Automotive'}</td>
                  <td className={`px-4 py-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.stockQuantity} units</td>
                  <td className="px-4 py-3">
                    {p.stockQuantity <= 5 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                        OPTIMAL
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <i className="bi bi-arrow-down-up text-xs" aria-hidden="true" />
                      <span>Adjust Stock</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Movements Table */}
      <div className="space-y-4">
        <h2 className={`text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <i className="bi bi-clock-history text-sm text-slate-400" aria-hidden="true" />
          Stock Movements Audit Trail
        </h2>

        <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left text-xs font-mono min-w-[700px]">
            <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp (UTC)</th>
                <th className="px-4 py-3 font-semibold">Product SKU</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Quantity Delta</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Audit Notes</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-6 text-center font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className={isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}>
                    <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{m.productSku}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className={m.quantityChange > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.referenceId}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{m.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          {/* Dedicated Fullscreen Frosted Backdrop Layer (zero background bleed) */}
          <div
            className="fixed inset-0 modal-backdrop-solid"
            onClick={() => setSelectedProduct(null)}
            aria-hidden="true"
          />

          {/* Centered Modal Card (3/4 window adaptive size) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 admin-modal-panel border rounded-xl shadow-2xl p-6 space-y-4 overflow-y-auto my-auto ${isDark ? 'admin-modal-dark bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider border-b pb-2 ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
              Adjust Inventory: {selectedProduct.name}
            </h2>

            <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Current Available Stock: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedProduct.stockQuantity} units</strong>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs font-mono">
              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Movement Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                >
                  <option value="RESTOCK">RESTOCK (+ Addition)</option>
                  <option value="DAMAGE_ADJUSTMENT">DAMAGE / SCRAP (- Reduction)</option>
                </select>
              </div>

              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Quantity Units *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Audit Log Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. Supplier batch intake from Pune"
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div className={`pt-2 flex justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
