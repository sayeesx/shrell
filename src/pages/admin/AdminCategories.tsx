import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Category } from '../../domain/types';
import { categoryRepository, productRepository } from '../../infrastructure/repositories';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';
import { ShrellLoader } from '../../components/common/ShrellLoader';

export const AdminCategories: React.FC = () => {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useBodyScrollLock(isModalOpen);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, prodRes] = await Promise.all([
        categoryRepository.getAll(),
        productRepository.getAll({ limit: 100 }),
      ]);

      // Calculate real product counts per category
      const counts: Record<string, number> = {};
      for (const p of prodRes.products) {
        if (p.categoryId) {
          counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
        }
      }

      setCategories(cats.sort((a, b) => a.displayOrder - b.displayOrder));
      setProductCounts(counts);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setDisplayOrder((categories.length + 1).toString());
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setDisplayOrder(cat.displayOrder.toString());
    setIsActive(cat.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    const cleanSlug = (slug.trim() || name.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const orderNum = Number(displayOrder) || (categories.length + 1);

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingCategory) {
        await categoryRepository.update(editingCategory.id, {
          name: name.trim(),
          slug: cleanSlug,
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          displayOrder: orderNum,
          isActive,
        });
      } else {
        await categoryRepository.create({
          name: name.trim(),
          slug: cleanSlug,
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          displayOrder: orderNum,
          isActive,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      try {
        await categoryRepository.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            CATEGORY MANAGEMENT (CMS)
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Create and organize catalog categories, slugs, descriptions and navigation order
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <i className="bi bi-plus-lg text-sm" aria-hidden="true" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="max-w-xs w-full">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
            }`}
          />
        </div>
        <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Total Categories: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{categories.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <ShrellLoader size={48} />
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono min-w-[700px]">
            <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Category Name &amp; Slug</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold text-center">Products</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No categories found. Click "Add Category" to create your first catalog category.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className={`transition-colors ${isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      #{cat.displayOrder}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <i className="bi bi-folder2 text-sm" aria-hidden="true" />
                          </div>
                        )}
                        <div>
                          <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                            {cat.name}
                          </div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            slug: <code className="text-slate-500 dark:text-slate-400">{cat.slug}</code>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 max-w-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {cat.description || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        (productCounts[cat.id] || 0) > 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : isDark ? 'bg-slate-850 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {productCounts[cat.id] || 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cat.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                      }`}>
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                        }`}
                        title="Edit Category"
                      >
                        <i className="bi bi-pencil text-xs" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <i className="bi bi-trash text-xs" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
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
            className={`relative z-10 admin-modal-panel rounded-xl border p-6 space-y-4 overflow-y-auto shadow-2xl my-auto ${
              isDark ? 'admin-modal-dark bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                <i className="bi bi-folder2 text-base text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
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

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-mono">
              <div>
                <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roof Racks & Overland Gear"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. roof-racks-overland"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Used in storefront URL: <code className="text-slate-500 dark:text-slate-400">/catalogue?category={slug || '...'}</code>
                </p>
              </div>

              <div>
                <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Category description for customer storefront & SEO..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded accent-slate-900 dark:accent-white w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold">Active in Catalog</span>
                  </label>
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Category Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... or /images/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-mono transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white disabled:opacity-50 font-bold font-mono uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
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
