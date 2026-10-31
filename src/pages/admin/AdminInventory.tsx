import React, { useEffect, useState } from 'react';
import { Layers, Search, History, ArrowUpDown } from 'lucide-react';
import { InventoryMovement, Product } from '../../domain/types';
import { inventoryRepository, productRepository } from '../../infrastructure/repositories';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [search, setSearch] = useState('');

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
      <div className="border-b border-surface-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
          INVENTORY MANAGEMENT & AUDIT TRAIL
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Atomic warehouse stock movements, reservation controls and intake records
        </p>
      </div>

      {/* Stock Levels Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            Current Warehouse Stock
          </h2>

          <div className="max-w-xs w-full relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter part or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-900 border border-surface-700 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-x-auto shadow-elevation">
          <table className="w-full text-left text-xs font-mono min-w-[650px]">
            <thead className="bg-surface-950/60 border-b border-surface-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">SKU & Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Available On Hand</th>
                <th className="px-4 py-3">Threshold Status</th>
                <th className="px-4 py-3 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-surface-850/50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    <div className="text-[10px] text-slate-500">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.categoryName || 'Automotive'}</td>
                  <td className="px-4 py-3 font-bold text-slate-100">{p.stockQuantity} units</td>
                  <td className="px-4 py-3">
                    {p.stockQuantity <= 5 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
                        OPTIMAL
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className="px-3 py-1.5 rounded bg-surface-800 hover:bg-surface-750 text-brand-400 font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
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
        <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          Stock Movements Audit Trail
        </h2>

        <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-x-auto shadow-elevation">
          <table className="w-full text-left text-xs font-mono min-w-[700px]">
            <thead className="bg-surface-950/60 border-b border-surface-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Product SKU</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity Delta</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 font-mono">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-850/50">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-semibold">{m.productSku}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-950 border border-surface-700 text-slate-300">
                        {m.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className={m.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{m.referenceId}</td>
                    <td className="px-4 py-3 text-slate-300">{m.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md bg-surface-900 border border-surface-700 rounded-lg shadow-elevation p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider border-b border-surface-800 pb-2">
              Adjust Inventory: {selectedProduct.name}
            </h2>

            <div className="text-xs text-slate-400 font-mono">
              Current Available Stock: <strong className="text-slate-100">{selectedProduct.stockQuantity} units</strong>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block uppercase text-slate-400 mb-1">Movement Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
                >
                  <option value="RESTOCK">RESTOCK (+ Addition)</option>
                  <option value="DAMAGE_ADJUSTMENT">DAMAGE / SCRAP (- Reduction)</option>
                </select>
              </div>

              <div>
                <label className="block uppercase text-slate-400 mb-1">Quantity Units *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block uppercase text-slate-400 mb-1">Audit Log Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. Supplier batch intake from Pune"
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-surface-800">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold uppercase tracking-wider"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
