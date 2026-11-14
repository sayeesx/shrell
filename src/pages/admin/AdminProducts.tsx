import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Category, Product } from '../../domain/types';
import { formatINR, paisaToRupees, rupeesToPaisa } from '../../domain/services/CurrencyService';
import {
  categoryRepository,
  productRepository,
} from '../../infrastructure/repositories';
import { cloudinaryService } from '../../infrastructure/cloudinary/cloudinaryService';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';
import { ImageCropUploadModal } from '../../components/admin/ImageCropUploadModal';
import { formatBytes, OptimizedImageResult } from '../../utils/imageOptimizer';

export const AdminProducts: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTechSpecsSection, setShowTechSpecsSection] = useState(false);

  useBodyScrollLock(isModalOpen);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [badge, setBadge] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [costPriceRupees, setCostPriceRupees] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '', '', '', '']);
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const [slotMeta, setSlotMeta] = useState<
    Record<number, { format: string; sizeBytes: number; width: number; height: number }>
  >({});
  const [pendingCrop, setPendingCrop] = useState<{ slotIndex: number; file: File } | null>(null);
  const [weightGrams, setWeightGrams] = useState('2000');
  const [dimensions, setDimensions] = useState('50x30x10');
  const [installationDifficulty, setInstallationDifficulty] = useState<Product['installationDifficulty']>('Moderate');
  const [warrantyMonths, setWarrantyMonths] = useState('24');
  const [specRows, setSpecRows] = useState<{ group: string; name: string; value: string }[]>([]);
  const [shippingCourier, setShippingCourier] = useState(
    'Across India on all orders over ₹300 via BlueDart & Delhivery Express.'
  );
  const [shippingDispatch, setShippingDispatch] = useState(
    'Dispatched within 24 hours from Pune logistics facility.'
  );
  const [shippingReturns, setShippingReturns] = useState(
    'Rapid replacement guarantee for transit or manufacturing issues within 7 days.'
  );

  const uploadFileToSlot = async (
    slotIndex: number,
    uploadFile: File,
    stats?: OptimizedImageResult
  ) => {
    setUploadingSlots((prev) => ({ ...prev, [slotIndex]: true }));
    setUploadErrors((prev) => ({ ...prev, [slotIndex]: '' }));
    try {
      const result = await cloudinaryService.uploadImage(uploadFile, {
        maxSizeBytes: 8 * 1024 * 1024,
        assetFolder: 'shrell/products',
        tags: 'product',
      });
      if (result && result.url) {
        setImageUrls((prev) => {
          const next = [...prev];
          next[slotIndex] = result.url;
          return next;
        });
        if (stats) {
          setSlotMeta((prev) => ({
            ...prev,
            [slotIndex]: {
              format: stats.extension.toUpperCase(),
              sizeBytes: stats.compressedBytes,
              width: stats.width,
              height: stats.height,
            },
          }));
        }
      }
    } catch (err: any) {
      setUploadErrors((prev) => ({
        ...prev,
        [slotIndex]: err.message || 'Image upload failed. Please try a different image or enter URL manually.',
      }));
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [slotIndex]: false }));
    }
  };

  const handleImageFileChange = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [slotIndex]: 'Raw file exceeds 20 MB limit. Please select a smaller source image.',
      }));
      return;
    }

    setUploadErrors((prev) => ({ ...prev, [slotIndex]: '' }));

    // Skip raster cropper for SVGs and upload directly
    if (file.type === 'image/svg+xml') {
      await uploadFileToSlot(slotIndex, file);
      return;
    }

    // Launch interactive crop -> WebP/JPEG compression workflow before CDN upload
    setPendingCrop({ slotIndex, file });
  };

  const handleCropConfirm = async (optimizedFile: File, stats: OptimizedImageResult) => {
    if (!pendingCrop) return;
    const { slotIndex } = pendingCrop;
    await uploadFileToSlot(slotIndex, optimizedFile, stats);
    setPendingCrop(null);
  };

  const handleImageUrlChange = (slotIndex: number, value: string) => {
    setImageUrls((prev) => {
      const next = [...prev];
      next[slotIndex] = value;
      return next;
    });
    if (!value) {
      setSlotMeta((prev) => {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      });
    }
  };

  const loadData = async () => {
    try {
      const [prodRes, catList] = await Promise.all([
        productRepository.getAll({ limit: 100 }),
        categoryRepository.getAll(),
      ]);
      setProducts(prodRes.products);
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSaveError(null);
    setIsSaving(false);
    setShowTechSpecsSection(false);
    setName('');
    setSku(`SHR-${Date.now().toString().slice(-6)}`);
    setBadge('');
    setPriceRupees('9999');
    setCostPriceRupees('5000');
    setStockQuantity('15');
    setCategoryId(categories[0]?.id || 'cat-car-interior');
    setShortDesc('');
    setDesc('');
    setImageUrls(['', '', '', '', '', '']);
    setUploadingSlots({});
    setUploadErrors({});
    setSlotMeta({});
    setPendingCrop(null);
    setWeightGrams('0');
    setDimensions('');
    setInstallationDifficulty('Moderate');
    setWarrantyMonths('24');
    setSpecRows([]);
    setShippingCourier('Across India on all orders over ₹300 via BlueDart & Delhivery Express.');
    setShippingDispatch('Dispatched within 24 hours from Pune logistics facility.');
    setShippingReturns('Rapid replacement guarantee for transit or manufacturing issues within 7 days.');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setSaveError(null);
    setIsSaving(false);
    setName(p.name);
    setSku(p.sku);
    setBadge(p.badge || '');
    setPriceRupees(paisaToRupees(p.pricePaisa).toString());
    setCostPriceRupees(p.costPricePaisa ? paisaToRupees(p.costPricePaisa).toString() : '0');
    setStockQuantity(p.stockQuantity.toString());
    setCategoryId(p.categoryId || categories[0]?.id || 'cat-car-interior');
    setShortDesc(p.shortDescription || '');
    setDesc(p.description || '');
    setImageUrls([
      p.images[0]?.url || '',
      p.images[1]?.url || '',
      p.images[2]?.url || '',
      p.images[3]?.url || '',
      p.images[4]?.url || '',
      p.images[5]?.url || '',
    ]);
    setUploadingSlots({});
    setUploadErrors({});
    setSlotMeta({});
    setPendingCrop(null);
    setWeightGrams(p.weightGrams ? p.weightGrams.toString() : '0');
    setDimensions(p.dimensionsCm || '');
    setInstallationDifficulty(p.installationDifficulty || 'Moderate');
    setWarrantyMonths((p.warrantyMonths ?? 12).toString());

    const allSpecs = Array.isArray(p.specifications) ? p.specifications : [];
    const techSpecs = allSpecs.filter((s) => s.group !== 'Shipping & Warranty');
    const shipSpecs = allSpecs.filter((s) => s.group === 'Shipping & Warranty');

    setShowTechSpecsSection(
      p.showTechnicalSpecs !== false &&
        (techSpecs.length > 0 || Boolean(p.dimensionsCm) || Boolean(p.weightGrams))
    );

    setSpecRows(techSpecs.map((s) => ({ group: s.group || 'General', name: s.name, value: s.value })));
    setShippingCourier(
      shipSpecs.find((s) => s.name === 'Free Express Courier')?.value ||
        'Across India on all orders over ₹300 via BlueDart & Delhivery Express.'
    );
    setShippingDispatch(
      shipSpecs.find((s) => s.name === 'Dispatch Guarantee')?.value ||
        'Dispatched within 24 hours from Pune logistics facility.'
    );
    setShippingReturns(
      shipSpecs.find((s) => s.name === '7-Day Returns')?.value ||
        'Rapid replacement guarantee for transit or manufacturing issues within 7 days.'
    );
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const pricePaisa = rupeesToPaisa(Number(priceRupees));
    const costPaisa = rupeesToPaisa(Number(costPriceRupees));
    const stock = Number(stockQuantity);
    const parsedWarranty = Math.max(0, Number(warrantyMonths) || 0);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const finalCategoryId = categoryId || categories[0]?.id || 'cat-car-interior';
    const selectedCat = categories.find((c) => c.id === finalCategoryId);
    const selectedBrand = { id: 'brand-shrell', name: 'SHRELL' };

    const images = imageUrls
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map((raw, idx) => {
        const cleanUrl = raw.startsWith('http://res.cloudinary.com/')
          ? raw.replace(/^http:\/\/res\.cloudinary\.com\//, 'https://res.cloudinary.com/')
          : raw;
        return {
          id: `img-${Date.now()}-${idx + 1}`,
          productId: editingProduct?.id || '',
          url: cleanUrl,
          altText: idx === 0 ? name : `${name} view ${idx + 1}`,
          sortOrder: idx + 1,
          isPrimary: idx === 0,
        };
      });

    const cleanedTechSpecs = showTechSpecsSection
      ? specRows
          .filter((r) => r.name.trim() && r.value.trim())
          .map((r) => ({
            group: r.group.trim() || 'General',
            name: r.name.trim(),
            value: r.value.trim(),
          }))
      : [];

    const shippingSpecs = [
      { group: 'Shipping & Warranty', name: 'Free Express Courier', value: shippingCourier.trim() },
      { group: 'Shipping & Warranty', name: 'Dispatch Guarantee', value: shippingDispatch.trim() },
      { group: 'Shipping & Warranty', name: '7-Day Returns', value: shippingReturns.trim() },
    ].filter((s) => s.value.length > 0);

    const specifications = [...cleanedTechSpecs, ...shippingSpecs];

    try {
      if (editingProduct) {
        await productRepository.update(editingProduct.id, {
          name,
          slug,
          sku,
          pricePaisa,
          costPricePaisa: costPaisa,
          stockQuantity: stock,
          categoryId: finalCategoryId,
          categoryName: selectedCat?.name || 'Automotive',
          brandId: 'brand-shrell',
          brandName: selectedBrand.name,
          badge: badge.trim() || undefined,
          shortDescription: shortDesc,
          description: desc,
          images,
          isUniversalFit: true,
          showTechnicalSpecs: showTechSpecsSection,
          weightGrams: showTechSpecsSection ? Number(weightGrams) || 0 : 0,
          dimensionsCm: showTechSpecsSection ? dimensions : '',
          installationDifficulty: showTechSpecsSection ? installationDifficulty : 'Moderate',
          warrantyMonths: parsedWarranty,
          specifications,
        });
      } else {
        await productRepository.create({
          name,
          slug,
          sku,
          badge: badge.trim() || undefined,
          pricePaisa,
          costPricePaisa: costPaisa,
          stockQuantity: stock,
          categoryId: finalCategoryId,
          categoryName: selectedCat?.name || 'Automotive',
          brandId: 'brand-shrell',
          brandName: selectedBrand.name,
          shortDescription: shortDesc,
          description: desc,
          images,
          isUniversalFit: true,
          showTechnicalSpecs: showTechSpecsSection,
          isActive: true,
          isFeatured: false,
          weightGrams: showTechSpecsSection ? Number(weightGrams) || 0 : 0,
          dimensionsCm: showTechSpecsSection ? dimensions : '',
          installationDifficulty: showTechSpecsSection ? installationDifficulty : 'Moderate',
          warrantyMonths: parsedWarranty,
          specifications,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setSaveError(err?.message || 'Failed to save product. Please check network connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (window.confirm(`Are you sure you want to remove "${prodName}" from catalogue?`)) {
      try {
        setDeletingId(id);
        await productRepository.delete(id);
        await loadData();
      } catch (err: any) {
        alert(`Failed to delete product: ${err?.message || 'Database error'}`);
      } finally {
        setDeletingId(null);
      }
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
          className="px-4 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-semibold line-clamp-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{prod.name}</span>
                    {prod.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF000E] text-white uppercase tracking-wider shrink-0">
                        {prod.badge}
                      </span>
                    )}
                  </div>
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
                      disabled={deletingId === prod.id}
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 disabled:opacity-40 transition-colors cursor-pointer"
                      aria-label={`Delete ${prod.name}`}
                    >
                      {deletingId === prod.id ? (
                        <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <i className="bi bi-trash text-xs" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Create / Edit Modal */}
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
            className={`relative z-10 admin-modal-panel border rounded-xl shadow-2xl overflow-hidden my-auto ${
              isDark ? 'admin-modal-dark bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isDark ? 'border-[#222222]' : 'border-slate-200'}`}>
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

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs font-mono">
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

              <div>
                <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Product Label / Overlay Badge (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['New Launches', 'Selling Fast', 'Best Seller', 'Hot Deal', 'Trending', 'Limited Edition'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBadge(badge === preset ? '' : preset)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                        badge === preset
                          ? 'bg-[#FF000E] border-[#FF000E] text-white'
                          : isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                            : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {badge && (
                    <button
                      type="button"
                      onClick={() => setBadge('')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. New Launches, Selling Fast, or type custom label"
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Displays as an overlay badge in front of the product image on cards and catalogue.
                </p>
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
              </div>

              {/* Product Images: Up to 6 Slots (Crop + Compress to WebP/JPEG before CDN, Slots 5 & 6 Optional) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className={`block uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Product Images (Crop + WebP Compress, Up to 6 Slots)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {imageUrls.filter((u) => u.trim()).length} / 6 added
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                    const url = imageUrls[slotIdx] || '';
                    const isUploading = Boolean(uploadingSlots[slotIdx]);
                    const slotError = uploadErrors[slotIdx];
                    const optimizedInfo = slotMeta[slotIdx];
                    const slotTitle =
                      slotIdx === 0
                        ? 'Image 1 (Primary)'
                        : slotIdx >= 4
                        ? `Image ${slotIdx + 1} (Optional)`
                        : `Image ${slotIdx + 1}`;

                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-lg border space-y-2 ${
                          isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-300 bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-semibold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {slotTitle}
                          </span>
                          {url && (
                            <button
                              type="button"
                              onClick={() => handleImageUrlChange(slotIdx, '')}
                              className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <i className="bi bi-trash text-[10px]" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <div
                          className={`p-2.5 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center min-h-[76px] ${
                            isDark ? 'border-slate-700 bg-slate-900/60 hover:border-slate-500' : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : url ? (
                            <div className="flex items-center gap-3 w-full">
                              <div
                                className={`w-12 h-12 shrink-0 rounded-md border overflow-hidden flex items-center justify-center p-1 ${
                                   isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <img
                                  src={url}
                                  alt={`Product slot ${slotIdx + 1}`}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/logos/shrell-brandicon_no-bg.png';
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                {optimizedInfo && (
                                  <span className="text-[10px] font-mono text-emerald-500 font-semibold truncate">
                                    {optimizedInfo.format} · {formatBytes(optimizedInfo.sizeBytes)} · {optimizedInfo.width}x{optimizedInfo.height}
                                  </span>
                                )}
                                <label className="text-[11px] font-medium cursor-pointer hover:underline flex items-center gap-1 text-slate-400 hover:text-white">
                                  <i className="bi bi-arrow-repeat text-xs" aria-hidden="true" />
                                  <span>Crop &amp; replace</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                                    onChange={(e) => handleImageFileChange(slotIdx, e)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer w-full py-1 text-center">
                              <i className={`bi bi-cloud-arrow-up text-lg mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden="true" />
                              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Upload image {slotIdx + 1}
                              </span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                                onChange={(e) => handleImageFileChange(slotIdx, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {slotError && (
                          <div className="text-[10px] font-mono text-rose-500">{slotError}</div>
                        )}

                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handleImageUrlChange(slotIdx, e.target.value)}
                          placeholder={slotIdx >= 4 ? "Paste image URL (optional)" : "Or paste image URL (optional)"}
                          aria-label={`Image ${slotIdx + 1} URL`}
                          className={`w-full border rounded-md px-2.5 py-1.5 text-[11px] transition-colors focus:outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Short Description * <span className="text-[10px] text-rose-500 lowercase font-normal">(compulsory)</span>
                </label>
                <input
                  type="text"
                  required
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
                <div className="flex items-center justify-between mb-1">
                  <label className={`block uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Detailed Technical Markdown <span className="text-[10px] text-slate-400 lowercase font-normal">(optional)</span>
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed engineering specifications and features (optional)..."
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              {/* Technical Specifications Section (Optional - Show / Hide toggle) */}
              <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Technical Specifications
                    </h3>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTechSpecsSection((prev) => !prev)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      showTechSpecsSection
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <i className={`bi ${showTechSpecsSection ? 'bi-eye-slash' : 'bi-plus-lg'} text-xs`} />
                    <span>{showTechSpecsSection ? 'Hide Specifications' : 'Show & Add Specifications'}</span>
                  </button>
                </div>

                {showTechSpecsSection && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSpecRows((prev) => [...prev, { group: 'General', name: '', value: '' }])}
                        className="px-2.5 py-1 rounded-md border border-slate-500/40 text-[11px] font-semibold hover:bg-slate-500/10 transition-colors cursor-pointer"
                      >
                        + Add Spec Row
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Net Weight (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={weightGrams}
                          onChange={(e) => setWeightGrams(e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Dimensions (cm)
                        </label>
                        <input
                          type="text"
                          value={dimensions}
                          onChange={(e) => setDimensions(e.target.value)}
                          placeholder="e.g. 80x25x15"
                          className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Installation
                        </label>
                        <select
                          value={installationDifficulty}
                          onChange={(e) => setInstallationDifficulty(e.target.value as Product['installationDifficulty'])}
                          className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                          }`}
                        >
                          <option value="Plug & Play">Plug &amp; Play</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Professional Recommended">Professional Recommended</option>
                        </select>
                      </div>
                    </div>

                    {specRows.length > 0 && (
                      <div className="space-y-2">
                        {specRows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) =>
                                setSpecRows((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                                )
                              }
                              placeholder="Spec name (e.g. Material)"
                              aria-label={`Specification ${idx + 1} name`}
                              className={`col-span-5 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                                isDark
                                  ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                                  : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                              }`}
                            />
                            <input
                              type="text"
                              value={row.value}
                              onChange={(e) =>
                                setSpecRows((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                                )
                              }
                              placeholder="Value (e.g. T6 Aluminium)"
                              aria-label={`Specification ${idx + 1} value`}
                              className={`col-span-6 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                                isDark
                                  ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                                  : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setSpecRows((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label={`Remove specification ${idx + 1}`}
                              className="col-span-1 p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer"
                            >
                              <i className="bi bi-trash text-xs" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping & Warranty Section */}
              <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Shipping &amp; Warranty
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Manufacturer Warranty (Months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Courier &amp; Express Shipping
                    </label>
                    <input
                      type="text"
                      value={shippingCourier}
                      onChange={(e) => setShippingCourier(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Dispatch Guarantee
                    </label>
                    <input
                      type="text"
                      value={shippingDispatch}
                      onChange={(e) => setShippingDispatch(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block uppercase font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Returns &amp; Replacement
                    </label>
                    <input
                      type="text"
                      value={shippingReturns}
                      onChange={(e) => setShippingReturns(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Error Alert Display */}
              {saveError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5">
                  <i className="bi bi-exclamation-octagon-fill text-sm shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold uppercase tracking-wider text-[11px]">Save Failed</div>
                    <div className="mt-0.5 leading-relaxed">{saveError}</div>
                  </div>
                </div>
              )}

              <div className={`pt-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-50 text-white font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 text-base" aria-hidden="true" />
                      <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Crop & Optimize Modal before CDN upload */}
      <ImageCropUploadModal
        file={pendingCrop?.file || null}
        isOpen={Boolean(pendingCrop)}
        slotLabel={
          pendingCrop
            ? pendingCrop.slotIndex === 0
              ? 'Image 1 (Primary)'
              : `Image ${pendingCrop.slotIndex + 1}`
            : 'Product Image'
        }
        suggestedName={
          sku || name
            ? `${(sku || name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-slot-${(pendingCrop?.slotIndex ?? 0) + 1}`
            : undefined
        }
        isUploading={pendingCrop ? Boolean(uploadingSlots[pendingCrop.slotIndex]) : false}
        onCancel={() => {
          if (!pendingCrop || !uploadingSlots[pendingCrop.slotIndex]) {
            setPendingCrop(null);
          }
        }}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};
