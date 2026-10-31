import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { Brand, Category, Product } from '../../domain/types';
import { formatINR, paisaToRupees, rupeesToPaisa } from '../../domain/services/CurrencyService';
import {
  brandRepository,
  categoryRepository,
  productRepository,
} from '../../infrastructure/repositories';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [costPriceRupees, setCostPriceRupees] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUniversal, setIsUniversal] = useState(false);
  const [weightGrams, setWeightGrams] = useState('2000');
  const [dimensions, setDimensions] = useState('50x30x10');

  const loadData = async () => {
    try {
      const [prodRes, catList, brandList] = await Promise.all([
        productRepository.getAll({ limit: 100 }),
        categoryRepository.getAll(),
        brandRepository.getAll(),
      ]);
      setProducts(prodRes.products);
      setCategories(catList);
      setBrands(brandList);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SHR-${Date.now().toString().slice(-6)}`);
    setPriceRupees('9999');
    setCostPriceRupees('5000');
    setStockQuantity('15');
    setCategoryId(categories[0]?.id || '');
    setBrandId(brands[0]?.id || '');
    setShortDesc('');
    setDesc('');
    setImageUrl('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80');
    setIsUniversal(true);
    setWeightGrams('3000');
    setDimensions('80x25x15');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setPriceRupees(paisaToRupees(p.pricePaisa).toString());
    setCostPriceRupees(p.costPricePaisa ? paisaToRupees(p.costPricePaisa).toString() : '0');
    setStockQuantity(p.stockQuantity.toString());
    setCategoryId(p.categoryId);
    setBrandId(p.brandId);
    setShortDesc(p.shortDescription);
    setDesc(p.description);
    setImageUrl(p.images[0]?.url || '');
    setIsUniversal(p.isUniversalFit);
    setWeightGrams(p.weightGrams.toString());
    setDimensions(p.dimensionsCm);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricePaisa = rupeesToPaisa(Number(priceRupees));
    const costPaisa = rupeesToPaisa(Number(costPriceRupees));
    const stock = Number(stockQuantity);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const selectedCat = categories.find((c) => c.id === categoryId);
    const selectedBrand = brands.find((b) => b.id === brandId);

    const images = [
      {
        id: `img-${Date.now()}`,
        productId: '',
        url: imageUrl.trim() || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
        altText: name,
        sortOrder: 1,
        isPrimary: true,
      },
    ];

    try {
      if (editingProduct) {
        await productRepository.update(editingProduct.id, {
          name,
          slug,
          sku,
          pricePaisa,
          costPricePaisa: costPaisa,
          stockQuantity: stock,
          categoryId,
          categoryName: selectedCat?.name,
          brandId,
          brandName: selectedBrand?.name,
          shortDescription: shortDesc,
          description: desc,
          images,
          isUniversalFit: isUniversal,
          weightGrams: Number(weightGrams),
          dimensionsCm: dimensions,
        });
      } else {
        await productRepository.create({
          name,
          slug,
          sku,
          pricePaisa,
          costPricePaisa: costPaisa,
          stockQuantity: stock,
          categoryId,
          categoryName: selectedCat?.name,
          brandId,
          brandName: selectedBrand?.name,
          shortDescription: shortDesc,
          description: desc,
          images,
          isUniversalFit: isUniversal,
          isActive: true,
          isFeatured: false,
          weightGrams: Number(weightGrams),
          dimensionsCm: dimensions,
          installationDifficulty: 'Moderate',
          warrantyMonths: 24,
          specifications: [
            { group: 'General', name: 'Mounting Style', value: isUniversal ? 'Universal' : 'Direct Fit' },
            { group: 'Dimensions', name: 'Packaging Box', value: `${dimensions} cm` },
          ],
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (window.confirm(`Are you sure you want to remove "${prodName}" from catalogue?`)) {
      await productRepository.delete(id);
      loadData();
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
            PRODUCT MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Create, edit catalogue inventory, pricing and technical metadata
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter by part name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-900 border border-surface-700 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-x-auto shadow-elevation">
        <table className="w-full text-left text-xs font-mono min-w-[700px]">
          <thead className="bg-surface-950/60 border-b border-surface-800 text-slate-400">
            <tr>
              <th className="px-4 py-3">Product Name & SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Selling Price</th>
              <th className="px-4 py-3">Stock Units</th>
              <th className="px-4 py-3">Fitment</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {filtered.map((prod) => (
              <tr key={prod.id} className="hover:bg-surface-850/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-100 line-clamp-1">{prod.name}</div>
                  <div className="text-[11px] text-slate-500">{prod.sku}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {prod.categoryName || 'Automotive'}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-100">
                  {formatINR(prod.pricePaisa)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prod.stockQuantity <= 5
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {prod.stockQuantity} in stock
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {prod.isUniversalFit ? 'Universal' : 'Vehicle Specific'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 rounded hover:bg-surface-800 text-slate-300 hover:text-brand-400 transition-colors"
                      aria-label={`Edit ${prod.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="p-1.5 rounded hover:bg-surface-800 text-slate-300 hover:text-rose-400 transition-colors"
                      aria-label={`Delete ${prod.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-2xl bg-surface-900 border border-surface-700 rounded-lg shadow-elevation overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 font-mono">
                {editingProduct ? 'EDIT PRODUCT DETAILS' : 'CREATE NEW CATALOGUE PRODUCT'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div>
                <label className="block uppercase text-slate-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SHRELL Stealth Wing Aerodynamic Crossbars"
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-slate-400 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1">Selling Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1">Cost Price (INR)</label>
                  <input
                    type="number"
                    value={costPriceRupees}
                    onChange={(e) => setCostPriceRupees(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1">Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase text-slate-400 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block uppercase text-slate-400 mb-1">Short Description</label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Brief 1-sentence product summary"
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block uppercase text-slate-400 mb-1">Detailed Technical Markdown</label>
                <textarea
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed engineering specifications and features..."
                  className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="modal-univ-fit"
                  type="checkbox"
                  checked={isUniversal}
                  onChange={(e) => setIsUniversal(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-700 bg-surface-950 text-brand-500"
                />
                <label htmlFor="modal-univ-fit" className="text-slate-300">
                  Universal Fit (Fits all standard vehicles)
                </label>
              </div>

              <div className="pt-4 border-t border-surface-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold uppercase tracking-wider"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
