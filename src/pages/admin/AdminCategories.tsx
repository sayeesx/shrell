import React, { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
            CATEGORY MANAGEMENT (CMS)
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
            Create and organize catalog categories, slugs, descriptions and navigation order
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
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
            className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-500 ${
              isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
            }`}
          />
        </div>
        <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
          Total Categories: <span className="font-bold text-brand-500">{categories.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className={`border rounded-lg overflow-x-auto ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <ShrellLoader size={48} />
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono min-w-[700px]">
            <thead className={`border-b ${isDark ? 'bg-surface-950/60 border-surface-800 text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Category Name &amp; Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Products</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-surface-800' : 'divide-[#E0DBD2]'}`}>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No categories found. Click "Add Category" to create your first catalog category.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className={`transition-colors ${isDark ? 'hover:bg-surface-800/40' : 'hover:bg-[#FAF8F5]'}`}>
                    <td className="px-4 py-3.5 font-bold text-brand-500">
                      #{cat.displayOrder}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-9 h-9 rounded object-cover border border-[#E0DBD2] flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 border ${isDark ? 'bg-surface-800 border-surface-700 text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
                            <Tag className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className={`font-bold ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                            {cat.name}
                          </div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#8E8587]'}`}>
                            slug: <code className="text-brand-400">{cat.slug}</code>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 max-w-xs truncate ${isDark ? 'text-slate-300' : 'text-[#5C5456]'}`}>
                      {cat.description || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        (productCounts[cat.id] || 0) > 0
                          ? isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDark ? 'bg-surface-800 text-slate-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {productCounts[cat.id] || 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cat.isActive
                          ? isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDark ? 'bg-rose-950/60 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-surface-800 text-slate-300 hover:text-brand-400' : 'hover:bg-[#EDE9E1] text-[#5C5456] hover:text-[#FF000E]'
                        }`}
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-500" />
                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block mb-1 font-bold">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roof Racks & Overland Gear"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                    isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. roof-racks-overland"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                    isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-[#8E8587]'}`}>
                  Used in storefront URL: <code className="text-brand-400">/catalogue?category={slug || '...'}</code>
                </p>
              </div>

              <div>
                <label className="block mb-1 font-bold">Description</label>
                <textarea
                  rows={3}
                  placeholder="Category description for customer storefront & SEO..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                    isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                      isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                    }`}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded accent-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold">Active in Catalog</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold">Category Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... or /images/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                    isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded border font-mono transition-colors cursor-pointer ${
                    isDark ? 'border-surface-700 hover:bg-surface-800 text-slate-300' : 'border-[#E0DBD2] hover:bg-[#EDE9E1] text-[#5C5456]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
