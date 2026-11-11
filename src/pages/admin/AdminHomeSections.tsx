import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Grid,
  Sliders,
  Image as ImageIcon,
  Layout,
  ExternalLink,
} from 'lucide-react';
import { Category, HomeSection, HomeSectionType } from '../../domain/types';
import {
  categoryRepository,
  homeSectionRepository,
} from '../../infrastructure/repositories';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { useTheme } from '../../application/ThemeContext';
import { ShrellLoader } from '../../components/common/ShrellLoader';

export const AdminHomeSections: React.FC = () => {
  const { isDark } = useTheme();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  useBodyScrollLock(isModalOpen);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sectionType, setSectionType] = useState<HomeSectionType>('PRODUCTS_GRID');
  const [categorySlug, setCategorySlug] = useState('');
  const [itemLimit, setItemLimit] = useState('4');
  const [viewAllUrl, setViewAllUrl] = useState('/catalogue');
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [customBannerTargetUrl, setCustomBannerTargetUrl] = useState('/catalogue');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [secs, cats] = await Promise.all([
        homeSectionRepository.getAll(),
        categoryRepository.getAll(),
      ]);
      setSections(secs);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load home sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSection(null);
    setTitle('');
    setSubtitle('');
    setSectionType('PRODUCTS_GRID');
    setCategorySlug('');
    setItemLimit('4');
    setViewAllUrl('/catalogue');
    setCustomBannerUrl('');
    setCustomBannerTargetUrl('/catalogue');
    setDisplayOrder((sections.length + 1).toString());
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (sec: HomeSection) => {
    setEditingSection(sec);
    setTitle(sec.title);
    setSubtitle(sec.subtitle || '');
    setSectionType(sec.sectionType);
    setCategorySlug(sec.categorySlug || '');
    setItemLimit((sec.limit || 4).toString());
    setViewAllUrl(sec.viewAllUrl || '/catalogue');
    setCustomBannerUrl(sec.customBannerUrl || '');
    setCustomBannerTargetUrl(sec.customBannerTargetUrl || '/catalogue');
    setDisplayOrder(sec.displayOrder.toString());
    setIsActive(sec.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Section title is required.');
      return;
    }

    const orderNum = Number(displayOrder) || (sections.length + 1);
    const limitNum = Number(itemLimit) || 4;

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingSection) {
        await homeSectionRepository.update(editingSection.id, {
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          sectionType,
          categorySlug: categorySlug ? categorySlug.trim() : undefined,
          limit: limitNum,
          viewAllUrl: viewAllUrl.trim() || undefined,
          customBannerUrl: customBannerUrl.trim() || undefined,
          customBannerTargetUrl: customBannerTargetUrl.trim() || undefined,
          displayOrder: orderNum,
          isActive,
        });
      } else {
        await homeSectionRepository.create({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          sectionType,
          categorySlug: categorySlug ? categorySlug.trim() : undefined,
          limit: limitNum,
          viewAllUrl: viewAllUrl.trim() || undefined,
          customBannerUrl: customBannerUrl.trim() || undefined,
          customBannerTargetUrl: customBannerTargetUrl.trim() || undefined,
          displayOrder: orderNum,
          isActive,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save section.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (sec: HomeSection) => {
    try {
      await homeSectionRepository.update(sec.id, { isActive: !sec.isActive });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle active state:', err);
    }
  };

  const handleDeleteSection = async (id: string, secTitle: string) => {
    if (confirm(`Are you sure you want to delete section "${secTitle}" from the Home Screen?`)) {
      try {
        await homeSectionRepository.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete section:', err);
      }
    }
  };

  const handleMove = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    const reorderedIds = newSections.map((s) => s.id);
    setSections(newSections);

    try {
      await homeSectionRepository.reorder(reorderedIds);
      await loadData();
    } catch (err) {
      console.error('Failed to reorder sections:', err);
    }
  };

  const getSectionTypeBadge = (type: HomeSectionType) => {
    switch (type) {
      case 'PRODUCTS_GRID':
        return { label: 'Product Grid', icon: Grid, color: 'text-brand-400 bg-brand-950/40 border-brand-800' };
      case 'PRODUCTS_CAROUSEL':
        return { label: 'Carousel', icon: Sliders, color: 'text-amber-400 bg-amber-950/40 border-amber-800' };
      case 'CATEGORIES_GRID':
        return { label: 'Categories Grid', icon: Layout, color: 'text-blue-400 bg-blue-950/40 border-blue-800' };
      case 'EDITORIAL_BENTO':
        return { label: 'Bento Feature', icon: Layers, color: 'text-purple-400 bg-purple-950/40 border-purple-800' };
      case 'BANNER_PROMO':
        return { label: 'Promo Banner', icon: ImageIcon, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' };
      default:
        return { label: type, icon: Grid, color: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
            HOME SCREEN CMS &amp; SECTIONS
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
            Add, reorder, toggle and configure dynamic sections across the customer storefront
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${
        isDark ? 'bg-surface-900 border-surface-700 text-slate-300' : 'bg-white border-[#E0DBD2] text-[#5C5456]'
      }`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-500" />
          <span>Active Sections Displayed on Storefront: <b className="text-brand-500">{sections.filter(s => s.isActive).length}</b> / {sections.length}</span>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:underline flex items-center gap-1 font-semibold"
        >
          <span>Preview Live Home Screen</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Table */}
      <div className={`border rounded-lg overflow-x-auto ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <ShrellLoader size={48} />
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono min-w-[750px]">
            <thead className={`border-b ${isDark ? 'bg-surface-950/60 border-surface-800 text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
              <tr>
                <th className="px-4 py-3 text-center">Order</th>
                <th className="px-4 py-3">Section Title &amp; Subtitle</th>
                <th className="px-4 py-3">Layout Type</th>
                <th className="px-4 py-3">Category Filter / Limit</th>
                <th className="px-4 py-3 text-center">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-surface-800' : 'divide-[#E0DBD2]'}`}>
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No home sections configured. Click "Add Section" to create your first dynamic section.
                  </td>
                </tr>
              ) : (
                sections.map((sec, idx) => {
                  const badge = getSectionTypeBadge(sec.sectionType);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={sec.id} className={`transition-colors ${isDark ? 'hover:bg-surface-800/40' : 'hover:bg-[#FAF8F5]'}`}>
                      {/* Order Controls */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'UP')}
                            className="p-1 rounded hover:bg-surface-800 disabled:opacity-20 cursor-pointer text-slate-400"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-brand-500 w-5 text-center">
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMove(idx, 'DOWN')}
                            className="p-1 rounded hover:bg-surface-800 disabled:opacity-20 cursor-pointer text-slate-400"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="px-4 py-3.5">
                        <div className={`font-bold ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                          {sec.title}
                        </div>
                        {sec.subtitle && (
                          <div className={`text-[11px] truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-[#8E8587]'}`}>
                            {sec.subtitle}
                          </div>
                        )}
                      </td>

                      {/* Layout Type */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Filter / Limit */}
                      <td className="px-4 py-3.5">
                        <div>
                          <span className="font-semibold text-brand-400">
                            {sec.categorySlug ? `Category: ${sec.categorySlug}` : 'All Featured Products'}
                          </span>
                          {sec.sectionType.startsWith('PRODUCTS') && (
                            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>
                              Limit: {sec.limit || 4} items
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(sec)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            sec.isActive
                              ? isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : isDark ? 'bg-surface-800 text-slate-400 border-surface-700 hover:bg-surface-700' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {sec.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{sec.isActive ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(sec)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-surface-800 text-slate-300 hover:text-brand-400' : 'hover:bg-[#EDE9E1] text-[#5C5456] hover:text-[#FF000E]'
                          }`}
                          title="Edit Section"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id, sec.title)}
                          className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" />
                <span>{editingSection ? 'Edit Home Section' : 'Create Dynamic Section'}</span>
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

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold">Section Layout Type *</label>
                  <select
                    value={sectionType}
                    onChange={(e) => setSectionType(e.target.value as HomeSectionType)}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                      isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                    }`}
                  >
                    <option value="PRODUCTS_GRID">Product Card Grid (Responsive 2 to 4 cols)</option>
                    <option value="PRODUCTS_CAROUSEL">Product Horizontal Carousel</option>
                    <option value="CATEGORIES_GRID">Categories Icon / Badge Grid</option>
                    <option value="EDITORIAL_BENTO">Editorial Bento Feature Box</option>
                    <option value="BANNER_PROMO">Promotional Banner Section</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Display Order Position</label>
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
              </div>

              <div>
                <label className="block mb-1 font-bold">Section Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crazy Finds, Best in Lighting, New Releases"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                    isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Subtitle / Tagline (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Blink and you'll miss it, Handcrafted automotive gear"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                    isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                  }`}
                />
              </div>

              {/* Product Filtering options */}
              {sectionType.startsWith('PRODUCTS') && (
                <div className={`p-3.5 rounded-lg border space-y-3 ${
                  isDark ? 'bg-surface-950/60 border-surface-800' : 'bg-[#F9F7F4] border-[#E0DBD2]'
                }`}>
                  <div className="font-bold text-brand-500">Product Selection &amp; Filters:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold">Filter By Category</label>
                      <select
                        value={categorySlug}
                        onChange={(e) => setCategorySlug(e.target.value)}
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                          isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                        }`}
                      >
                        <option value="">All Categories (General Showcase)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-bold">Number of Products to Show</label>
                      <select
                        value={itemLimit}
                        onChange={(e) => setItemLimit(e.target.value)}
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                          isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                        }`}
                      >
                        <option value="4">4 Products (1 row on desktop)</option>
                        <option value="6">6 Products</option>
                        <option value="8">8 Products (2 rows on desktop)</option>
                        <option value="12">12 Products</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">"See All" Destination Link</label>
                    <input
                      type="text"
                      placeholder="/catalogue or /catalogue?category=roof-racks"
                      value={viewAllUrl}
                      onChange={(e) => setViewAllUrl(e.target.value)}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                        isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Promo Banner settings */}
              {sectionType === 'BANNER_PROMO' && (
                <div className={`p-3.5 rounded-lg border space-y-3 ${
                  isDark ? 'bg-surface-950/60 border-surface-800' : 'bg-[#F9F7F4] border-[#E0DBD2]'
                }`}>
                  <div className="font-bold text-brand-500">Banner Asset Configuration:</div>
                  <div>
                    <label className="block mb-1 font-bold">Image URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://res.cloudinary.com/... or /images/..."
                      value={customBannerUrl}
                      onChange={(e) => setCustomBannerUrl(e.target.value)}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                        isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold">Target Click Destination</label>
                    <input
                      type="text"
                      placeholder="/catalogue?category=... or /pre-book"
                      value={customBannerTargetUrl}
                      onChange={(e) => setCustomBannerTargetUrl(e.target.value)}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${
                        isDark ? 'bg-surface-900 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded accent-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold">Active &amp; Visible on Storefront</span>
                </label>
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
                  {isSaving ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
