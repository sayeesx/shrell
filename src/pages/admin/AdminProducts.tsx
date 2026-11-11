import React, { useEffect, useState } from 'react';
import { Brand, Category, Product } from '../../domain/types';
import { formatINR, paisaToRupees, rupeesToPaisa } from '../../domain/services/CurrencyService';
import {
  brandRepository,
  categoryRepository,
  productRepository,
} from '../../infrastructure/repositories';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';

export const AdminProducts: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useBodyScrollLock(isModalOpen);

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
    setImageUrl('/logos/shrell-full_white-text_black-logo.png');
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

    const cleanImageUrl = imageUrl.trim().startsWith('http://res.cloudinary.com/')
      ? imageUrl.trim().replace(/^http:\/\/res\.cloudinary\.com\//, 'https://res.cloudinary.com/')
      : imageUrl.trim();

    const images = [
      {
        id: `img-${Date.now()}`,
        productId: '',
        url: cleanImageUrl || '/logos/shrell-full_white-text_black-logo.png',
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            PRODUCT MANAGEMENT
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Create, edit catalogue inventory, pricing and technical metadata
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <i className="bi bi-plus-lg text-sm" aria-hidden="true" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <i className={`bi bi-search text-xs absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} aria-hidden="true" />
        <input
          type="text"
          placeholder="Filter by part name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
          }`}
        />
      </div>

      {/* Table */}
      <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <table className="w-full text-left text-xs font-mono min-w-[700px]">
          <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <tr>
              <th className="px-4 py-3 font-semibold">Product Name & SKU</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Selling Price</th>
              <th className="px-4 py-3 font-semibold">Stock Units</th>
              <th className="px-4 py-3 font-semibold">Fitment</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {filtered.map((prod) => (
              <tr key={prod.id} className={isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}>
                <td className="px-4 py-3">
                  <div className={`font-semibold line-clamp-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{prod.name}</div>
                  <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{prod.sku}</div>
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {prod.categoryName || 'Automotive'}
                </td>
                <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(prod.pricePaisa)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prod.stockQuantity <= 5
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {prod.stockQuantity} in stock
                  </span>
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {prod.isUniversalFit ? 'Universal' : 'Vehicle Specific'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                      }`}
                      aria-label={`Edit ${prod.name}`}
                    >
                      <i className="bi bi-pencil text-xs" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      aria-label={`Delete ${prod.name}`}
                    >
                      <i className="bi bi-trash text-xs" aria-hidden="true" />
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div className={`relative w-full max-w-2xl border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">
                {editingProduct ? 'Edit Product Details' : 'Create New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                aria-label="Close modal"
              >
                <i className="bi bi-x-lg text-xs" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div>
                <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SHRELL Stealth Wing Aerodynamic Crossbars"
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Selling Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cost Price (INR)</label>
                  <input
                    type="number"
                    value={costPriceRupees}
                    onChange={(e) => setCostPriceRupees(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
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
                <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/logos/shrell-full_white-text_black-logo.png"
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Short Description</label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Brief 1-sentence product summary"
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Detailed Technical Markdown</label>
                <textarea
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed engineering specifications and features..."
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="modal-univ-fit"
                  type="checkbox"
                  checked={isUniversal}
                  onChange={(e) => setIsUniversal(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-slate-900"
                />
                <label htmlFor="modal-univ-fit" className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  Universal Fit (Fits all standard vehicles)
                </label>
              </div>

              <div className={`pt-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
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
