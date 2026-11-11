import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
        return { label: 'Product Grid', icon: 'bi-grid-3x3-gap', color: 'text-slate-200 bg-slate-800 border-slate-700' };
      case 'PRODUCTS_CAROUSEL':
        return { label: 'Carousel', icon: 'bi-sliders', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
      case 'CATEGORIES_GRID':
        return { label: 'Categories Grid', icon: 'bi-layout-text-window', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
      case 'EDITORIAL_BENTO':
        return { label: 'Bento Feature', icon: 'bi-stack', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' };
      case 'BANNER_PROMO':
        return { label: 'Promo Banner', icon: 'bi-image', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
      default:
        return { label: type, icon: 'bi-grid', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            HOME SCREEN CMS &amp; SECTIONS
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Add, reorder, toggle and configure dynamic sections across the customer storefront
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <i className="bi bi-plus-lg text-sm" aria-hidden="true" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <i className="bi bi-stack text-sm text-slate-400" aria-hidden="true" />
          <span>Active Sections Displayed on Storefront: <b className={isDark ? 'text-white' : 'text-slate-900'}>{sections.filter(s => s.isActive).length}</b> / {sections.length}</span>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-semibold transition-colors"
        >
          <span>Preview Live Home Screen</span>
          <i className="bi bi-box-arrow-up-right text-xs" aria-hidden="true" />
        </a>
      </div>

      {/* Table */}
      <div className={`border rounded-xl overflow-x-auto shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <ShrellLoader size={48} />
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono min-w-[750px]">
            <thead className={`border-b ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3 text-center font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Section Title &amp; Subtitle</th>
                <th className="px-4 py-3 font-semibold">Layout Type</th>
                <th className="px-4 py-3 font-semibold">Category Filter / Limit</th>
                <th className="px-4 py-3 text-center font-semibold">Visibility</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No home sections configured. Click "Add Section" to create your first dynamic section.
                  </td>
                </tr>
              ) : (
                sections.map((sec, idx) => {
                  const badge = getSectionTypeBadge(sec.sectionType);
                  return (
                    <tr key={sec.id} className={`transition-colors ${isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'}`}>
                      {/* Order Controls */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'UP')}
                            className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-20 cursor-pointer text-slate-400 transition-colors"
                            title="Move Up"
                          >
                            <i className="bi bi-arrow-up text-xs" aria-hidden="true" />
                          </button>
                          <span className={`font-bold w-5 text-center ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMove(idx, 'DOWN')}
                            className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-20 cursor-pointer text-slate-400 transition-colors"
                            title="Move Down"
                          >
                            <i className="bi bi-arrow-down text-xs" aria-hidden="true" />
                          </button>
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="px-4 py-3.5">
                        <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {sec.title}
                        </div>
                        {sec.subtitle && (
                          <div className={`text-[11px] truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {sec.subtitle}
                          </div>
                        )}
                      </td>

                      {/* Layout Type */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.color}`}>
                          <i className={`bi ${badge.icon} text-xs`} aria-hidden="true" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Filter / Limit */}
                      <td className="px-4 py-3.5">
                        <div>
                          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {sec.categorySlug ? `Category: ${sec.categorySlug}` : 'All Featured Products'}
                          </span>
                          {sec.sectionType.startsWith('PRODUCTS') && (
                            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                          }`}
                        >
                          <i className={`bi ${sec.isActive ? 'bi-eye' : 'bi-eye-slash'} text-xs`} aria-hidden="true" />
                          <span>{sec.isActive ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(sec)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                          }`}
                          title="Edit Section"
                        >
                          <i className="bi bi-pencil text-xs" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id, sec.title)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete Section"
                        >
                          <i className="bi bi-trash text-xs" aria-hidden="true" />
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
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen min-h-screen bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, zIndex: 9999 }}
        >
          <div className={`w-full max-w-xl rounded-xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                <i className="bi bi-stack text-base text-slate-400" aria-hidden="true" />
                <span>{editingSection ? 'Edit Home Section' : 'Create Dynamic Section'}</span>
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

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Section Layout Type *</label>
                  <select
                    value={sectionType}
                    onChange={(e) => setSectionType(e.target.value as HomeSectionType)}
                    className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
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
                  <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Display Order Position</label>
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
              </div>

              <div>
                <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Section Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crazy Finds, Best in Lighting, New Releases"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Subtitle / Tagline (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Blink and you'll miss it, Handcrafted automotive gear"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                />
              </div>

              {/* Product Filtering options */}
              {sectionType.startsWith('PRODUCTS') && (
                <div className={`p-3.5 rounded-lg border space-y-3 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Product Selection &amp; Filters:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Filter By Category</label>
                      <select
                        value={categorySlug}
                        onChange={(e) => setCategorySlug(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
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
                      <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Number of Products to Show</label>
                      <select
                        value={itemLimit}
                        onChange={(e) => setItemLimit(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
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
                    <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>"See All" Destination Link</label>
                    <input
                      type="text"
                      placeholder="/catalogue or /catalogue?category=roof-racks"
                      value={viewAllUrl}
                      onChange={(e) => setViewAllUrl(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Promo Banner settings */}
              {sectionType === 'BANNER_PROMO' && (
                <div className={`p-3.5 rounded-lg border space-y-3 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Banner Asset Configuration:</div>
                  <div>
                    <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Image URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://res.cloudinary.com/... or /images/..."
                      value={customBannerUrl}
                      onChange={(e) => setCustomBannerUrl(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Target Click Destination</label>
                    <input
                      type="text"
                      placeholder="/catalogue?category=... or /pre-book"
                      value={customBannerTargetUrl}
                      onChange={(e) => setCustomBannerTargetUrl(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
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
                    className="rounded accent-slate-900 dark:accent-white w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold">Active &amp; Visible on Storefront</span>
                </label>
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
                  className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 disabled:opacity-50 font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  {isSaving ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
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

