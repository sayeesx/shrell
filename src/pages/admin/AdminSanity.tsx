import React, { useState, useEffect } from 'react';
import {
  getSanityConfig,
  saveSanityConfig,
  resetSanityConfig,
  isSanityConfigured,
  SanityConfig,
} from '../../infrastructure/sanity/sanityConfig';
import {
  testSanityConnection,
  fetchSanityProducts,
  createSanityProduct,
  fetchSanityBanners,
  createSanityBanner,
  deleteSanityBanner,
  toggleSanityBannerActive,
  ConnectionTestResult,
} from '../../infrastructure/sanity/sanityClient';
import { INITIAL_PRODUCTS } from '../../infrastructure/repositories/seedData';
import { useTheme } from '../../application/ThemeContext';

export const AdminSanity: React.FC = () => {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<SanityConfig>(getSanityConfig());
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'config' | 'products' | 'create' | 'banners' | 'schemas' | 'export'>('config');

  // Sanity Live Products State
  const [sanityProducts, setSanityProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Sanity Live Banners State
  const [sanityBanners, setSanityBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);

  // Banner Upload Form State
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerAltText, setBannerAltText] = useState('');
  const [bannerTargetUrl, setBannerTargetUrl] = useState('/catalogue');
  const [bannerOrder, setBannerOrder] = useState('1');
  const [bannerDesktopFile, setBannerDesktopFile] = useState<File | null>(null);
  const [bannerDesktopPreview, setBannerDesktopPreview] = useState('');
  const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);
  const [bannerMobilePreview, setBannerMobilePreview] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Create Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductSlug, setNewProductSlug] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('4999');
  const [newProductSalePrice, setNewProductSalePrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('lighting');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState<string | null>(null);

  // Auto-generate slug on product name input
  const handleNameChange = (name: string) => {
    setNewProductName(name);
    setNewProductSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSanityConfig(config);
    setConfig(updated);
    setStatusMessage({ text: 'Sanity configuration successfully saved.', isError: false });
    handleTestConnection();
  };

  const handleResetConfig = () => {
    if (window.confirm('Reset Sanity configuration to defaults?')) {
      const reset = resetSanityConfig();
      setConfig(reset);
      setTestResult(null);
      setStatusMessage({ text: 'Configuration reset to defaults.', isError: false });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      const result = await testSanityConnection();
      setTestResult(result);
      if (result.success) {
        setStatusMessage({ text: result.message, isError: false });
        loadSanityProducts();
      } else {
        setStatusMessage({ text: result.error || result.message, isError: true });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Connection test failed.',
        error: err?.message || String(err),
      });
      setStatusMessage({ text: 'Failed to connect to Sanity.', isError: true });
    } finally {
      setIsTesting(false);
    }
  };

  const loadSanityProducts = async () => {
    setLoadingProducts(true);
    try {
      const docs = await fetchSanityProducts();
      setSanityProducts(docs);
    } catch (err) {
      console.warn('Error loading Sanity products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSanityBanners = async () => {
    setLoadingBanners(true);
    try {
      const docs = await fetchSanityBanners(true);
      setSanityBanners(docs);
    } catch (err) {
      console.warn('Error loading Sanity banners:', err);
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) {
      setStatusMessage({ text: 'Banner title / alt text is required.', isError: true });
      return;
    }
    if (!bannerDesktopFile && !bannerDesktopPreview) {
      setStatusMessage({ text: 'Please select a desktop banner image to upload.', isError: true });
      return;
    }

    setIsUploadingBanner(true);
    setStatusMessage(null);
    try {
      const result = await createSanityBanner({
        title: bannerTitle.trim(),
        altText: bannerAltText.trim() || bannerTitle.trim(),
        targetUrl: bannerTargetUrl.trim() || '/catalogue',
        order: parseInt(bannerOrder) || 1,
        isActive: true,
        desktopImageFile: bannerDesktopFile || undefined,
        mobileImageFile: bannerMobileFile || undefined,
      });

      if (result.success) {
        setStatusMessage({
          text: `Hero banner "${bannerTitle}" published to Sanity (ID: ${result.id})!`,
          isError: false,
        });
        setBannerTitle('');
        setBannerAltText('');
        setBannerTargetUrl('/catalogue');
        setBannerOrder('1');
        setBannerDesktopFile(null);
        setBannerDesktopPreview('');
        setBannerMobileFile(null);
        setBannerMobilePreview('');
        await loadSanityBanners();
      } else {
        setStatusMessage({ text: result.error || 'Failed to publish banner to Sanity.', isError: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Error uploading banner.', isError: true });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete this banner from Sanity?')) return;
    try {
      const res = await deleteSanityBanner(id);
      if (res.success) {
        setStatusMessage({ text: 'Banner deleted from Sanity.', isError: false });
        await loadSanityBanners();
      } else {
        setStatusMessage({ text: res.error || 'Failed to delete banner.', isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: e?.message || 'Error deleting banner.', isError: true });
    }
  };

  const handleToggleBanner = async (id: string, currentState: boolean) => {
    try {
      const res = await toggleSanityBannerActive(id, !currentState);
      if (res.success) {
        setStatusMessage({ text: `Banner ${!currentState ? 'activated' : 'deactivated'} in Sanity.`, isError: false });
        await loadSanityBanners();
      } else {
        setStatusMessage({ text: res.error || 'Failed to update banner.', isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: e?.message || 'Error updating banner.', isError: true });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      setStatusMessage({ text: 'Product title is required.', isError: true });
      return;
    }

    setIsCreatingProduct(true);
    setStatusMessage(null);
    try {
      const result = await createSanityProduct({
        name: newProductName.trim(),
        slug: newProductSlug.trim() || newProductName.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(newProductPrice) || 0,
        salePrice: newProductSalePrice ? parseFloat(newProductSalePrice) : undefined,
        category: newProductCategory,
        description: newProductDesc,
        inStock: true,
        isFeatured: true,
      });

      if (result.success) {
        setStatusMessage({
          text: `Product "${newProductName}" published to Sanity (ID: ${result.id})!`,
          isError: false,
        });
        setNewProductName('');
        setNewProductSlug('');
        setNewProductPrice('4999');
        setNewProductSalePrice('');
        setNewProductDesc('');
        loadSanityProducts();
        setActiveTab('products');
      } else {
        setStatusMessage({ text: result.error || 'Failed to create product in Sanity.', isError: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Error creating product.', isError: true });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSchema(label);
    setTimeout(() => setCopiedSchema(null), 2500);
  };

  // Test on mount if configured
  useEffect(() => {
    if (isSanityConfigured()) {
      handleTestConnection();
    }
  }, []);

  const studioUrl = config.studioUrl || (config.projectId ? `https://${config.projectId}.sanity.studio` : '');

  // Schema Definitions
  const productSchemaCode = `// sanity/schemaTypes/product.ts
import { defineType, defineField } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Product Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'price', title: 'Price (INR ₹)', type: 'number', validation: (Rule) => Rule.required().positive() }),
    defineField({ name: 'salePrice', title: 'Sale / Original Price (INR ₹)', type: 'number' }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }] }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({
      name: 'images',
      title: 'Product Photos',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }]
        }
      ]
    }),
    defineField({ name: 'inStock', title: 'In Stock', type: 'boolean', initialValue: true }),
    defineField({ name: 'isFeatured', title: 'Featured on Storefront', type: 'boolean', initialValue: false }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
  ]
});`;

  const bannerSchemaCode = `// sanity/schemaTypes/banner.ts
import { defineType, defineField } from 'sanity';

export const banner = defineType({
  name: 'banner',
  title: 'Hero Banners',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'desktopImage', title: 'Desktop Banner (16:5 ratio)', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'mobileImage', title: 'Mobile Banner (16:9 ratio)', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'targetUrl', title: 'Click Target URL', type: 'string', initialValue: '/catalogue' }),
    defineField({ name: 'altText', title: 'Accessible Alt Text', type: 'string' }),
    defineField({ name: 'order', title: 'Display Priority Order', type: 'number', initialValue: 1 }),
    defineField({ name: 'isActive', title: 'Active on Storefront', type: 'boolean', initialValue: true }),
  ]
});`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
              <i className="bi bi-stars text-sm" aria-hidden="true" />
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Sanity CMS Integration Hub
            </h1>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Connect Sanity Headless CMS for live product catalogue, image management, and real-time storefront synchronization.
          </p>
        </div>

        {/* Studio Link Button */}
        {studioUrl && (
          <a
            href={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <i className="bi bi-box-arrow-up-right text-xs" aria-hidden="true" />
            <span>Open Sanity Studio</span>
          </a>
        )}
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
            statusMessage.isError
              ? isDark
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
              : isDark
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.isError ? (
              <i className="bi bi-exclamation-circle-fill text-sm shrink-0" aria-hidden="true" />
            ) : (
              <i className="bi bi-check-circle-fill text-sm shrink-0" aria-hidden="true" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connection Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              testResult?.success
                ? isDark
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : isDark
                  ? 'bg-slate-950 border border-slate-800 text-slate-400'
                  : 'bg-slate-100 border border-slate-200 text-slate-500'
            }`}
          >
            <i className="bi bi-database text-lg" aria-hidden="true" />
          </div>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sanity Status</div>
            <div className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span
                className={`w-2 h-2 rounded-full ${
                  testResult?.success ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{testResult?.success ? 'Connected Live' : 'Local Fallback'}</span>
            </div>
          </div>
        </div>

        {/* Live Products Count */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
            <i className="bi bi-box-seam text-lg" aria-hidden="true" />
          </div>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sanity Products</div>
            <div className={`text-sm font-bold mt-0.5 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {testResult?.productCount !== undefined ? testResult.productCount : '0 (Local: 12)'}
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
            <i className="bi bi-arrow-clockwise text-lg" aria-hidden="true" />
          </div>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>API Latency</div>
            <div className={`text-sm font-bold mt-0.5 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {testResult?.latencyMs ? `${testResult.latencyMs}ms` : 'Instant cache'}
            </div>
          </div>
        </div>

        {/* Active Dataset */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
            <i className="bi bi-stars text-lg" aria-hidden="true" />
          </div>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dataset / Project</div>
            <div className={`text-xs font-bold mt-0.5 font-mono truncate max-w-[130px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {config.projectId ? `${config.dataset} (${config.projectId})` : 'Not configured'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex border-b overflow-x-auto gap-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'config'
              ? isDark
                ? 'border-slate-200 text-white'
                : 'border-slate-900 text-slate-900'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Configuration &amp; Credentials
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('products');
            loadSanityProducts();
          }}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? isDark
                ? 'border-slate-200 text-white'
                : 'border-slate-900 text-slate-900'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Live Products &amp; Photos ({sanityProducts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'create'
              ? isDark
                ? 'border-slate-200 text-white'
                : 'border-slate-900 text-slate-900'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          + Quick Add Product
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('banners');
            loadSanityBanners();
          }}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'banners'
              ? isDark
                ? 'border-slate-200 text-white'
                : 'border-slate-900 text-slate-900'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Hero Banners ({sanityBanners.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schemas')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'schemas'
              ? isDark
                ? 'border-slate-200 text-white'
                : 'border-slate-900 text-slate-900'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Studio Schemas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'export'
              ? isDark
                ? 'border-slate-200 text-white'
                : 'border-slate-900 text-slate-900'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Export Storefront JSON
        </button>
      </div>

      {/* TAB 1: Configuration */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className={`space-y-5 border rounded-xl p-5 sm:p-6 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
          <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Sanity Connection Credentials
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Find your Project ID and API tokens in the{' '}
              <a
                href="https://www.sanity.io/manage"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:opacity-80 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              >
                Sanity Management Console
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project ID */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                1. Project ID *
              </label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                placeholder="e.g. o0g8w9v2"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Found in project settings or sanity.config.ts
              </span>
            </div>

            {/* Dataset */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                2. Dataset *
              </label>
              <input
                type="text"
                value={config.dataset}
                onChange={(e) => setConfig({ ...config, dataset: e.target.value })}
                placeholder="production"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Standard default dataset name is "production"
              </span>
            </div>

            {/* API Version */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                3. API Version
              </label>
              <input
                type="text"
                value={config.apiVersion}
                onChange={(e) => setConfig({ ...config, apiVersion: e.target.value })}
                placeholder="2024-01-01"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Recommended: 2024-01-01 (ISO date format)
              </span>
            </div>

            {/* Studio URL */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                4. Sanity Studio URL (Optional)
              </label>
              <input
                type="text"
                value={config.studioUrl || ''}
                onChange={(e) => setConfig({ ...config, studioUrl: e.target.value })}
                placeholder="https://your-studio.sanity.studio or http://localhost:3333"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Link to your deployed Sanity Studio
              </span>
            </div>

            {/* API Token (Optional) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                5. Sanity API Token (Optional for write mutations &amp; private datasets)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.token || ''}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="sk..."
                  className={`w-full px-3 py-2 pr-10 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? (
                    <i className="bi bi-eye-slash text-sm" aria-hidden="true" />
                  ) : (
                    <i className="bi bi-eye text-sm" aria-hidden="true" />
                  )}
                </button>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Only needed if your dataset is private or if you wish to create products directly from this portal.
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={handleResetConfig}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono transition-colors border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 border transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <i className={`bi bi-arrow-clockwise text-xs ${isTesting ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                className={`px-5 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                  isDark
                    ? 'bg-slate-100 hover:bg-white text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Live Products & Photos */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className={`flex items-center justify-between border rounded-xl p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div>
              <h2 className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Live Sanity Catalogue
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Products and photos dynamically loaded from your Sanity project.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSanityProducts}
              disabled={loadingProducts}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <i className={`bi bi-arrow-clockwise text-xs ${loadingProducts ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingProducts ? (
            <div className={`p-12 text-center text-xs font-mono border rounded-xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              <i className="bi bi-arrow-clockwise text-xl animate-spin mx-auto block mb-2 text-slate-400" aria-hidden="true" />
              <span>Querying Sanity GROQ endpoints...</span>
            </div>
          ) : sanityProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sanityProducts.map((p) => (
                <div
                  key={p._id}
                  className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className={`aspect-video flex items-center justify-center overflow-hidden border-b relative ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <i className="bi bi-image text-2xl" aria-hidden="true" />
                        <span className="text-[10px] font-mono">No Image Asset</span>
                      </div>
                    )}
                    {p.isFeatured && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className={`flex items-center justify-between text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>{p.categoryName || p.category || 'Automotive'}</span>
                      <span className="text-emerald-500 font-semibold">
                        ₹{(p.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </h3>
                    <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {p.description || 'No description provided in Sanity document.'}
                    </p>

                    <div className={`pt-2 border-t text-[10px] font-mono truncate ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                      ID: {p._id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-8 text-center border rounded-xl space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <i className="bi bi-box-seam text-3xl mx-auto block text-slate-400" aria-hidden="true" />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No Sanity Products Found</h3>
              <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No documents of type <code className="font-mono text-emerald-500">product</code> exist in your dataset yet. You can create one right now using the Quick Add tab or import the existing store items.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                  isDark
                    ? 'bg-slate-100 hover:bg-white text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <i className="bi bi-plus-lg text-xs" aria-hidden="true" />
                <span>Create First Product</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Quick Add Product */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateProduct} className={`border rounded-xl p-5 sm:p-6 space-y-5 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
          <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Create New Product in Sanity
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Publishes directly into your Sanity dataset using the Sanity Mutations API. Requires an API write token.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Product Title *</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. SHRELL 4K Dual Sensor Dash Cam"
                required
                className={`w-full px-3 py-2 border rounded-lg text-xs font-sans focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>URL Slug *</label>
              <input
                type="text"
                value={newProductSlug}
                onChange={(e) => setNewProductSlug(e.target.value)}
                placeholder="shrell-4k-dual-sensor-dash-cam"
                required
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Price (INR ₹) *</label>
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="4999"
                required
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Compare-At / Strikethrough Price (INR ₹)</label>
              <input
                type="number"
                value={newProductSalePrice}
                onChange={(e) => setNewProductSalePrice(e.target.value)}
                placeholder="6499"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                }`}
              >
                <option value="air-fresheners">Air Fresheners</option>
                <option value="auxiliary-lighting">Lighting</option>
                <option value="all-weather-floor-protection">Floor Mats</option>
                <option value="dash-cameras">Dash Cams</option>
                <option value="tyre-care-air-systems">Tyre Care</option>
                <option value="touring-recovery-gear">Recovery</option>
                <option value="audio">Audio &amp; Tech</option>
                <option value="car-care">Car Care</option>
                <option value="cooling-systems">Cooling</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Product Description</label>
              <textarea
                value={newProductDesc}
                onChange={(e) => setNewProductDesc(e.target.value)}
                rows={3}
                placeholder="Provide specs, fitment information, and key features..."
                className={`w-full px-3 py-2 border rounded-lg text-xs font-sans focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
            </div>
          </div>

          <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="submit"
              disabled={isCreatingProduct}
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-colors ${
                isDark
                  ? 'bg-slate-100 hover:bg-white text-slate-950 disabled:opacity-50'
                  : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50'
              }`}
            >
              {isCreatingProduct ? (
                <>
                  <i className="bi bi-arrow-clockwise text-xs animate-spin" aria-hidden="true" />
                  <span>Publishing to Sanity...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-plus-lg text-xs" aria-hidden="true" />
                  <span>Publish to Sanity</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Hero Banners & Asset Upload */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {/* Banner Upload Form */}
          <form onSubmit={handleCreateBanner} className={`space-y-5 border rounded-xl p-5 sm:p-6 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
            <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h2 className={`text-sm font-bold font-mono uppercase tracking-wide flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <i className="bi bi-images text-sm text-slate-400" aria-hidden="true" />
                  <span>Upload Hero Banner to Sanity CMS</span>
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Upload desktop and mobile banner assets directly to Sanity Asset CDN and publish live hero slides.
                </p>
              </div>

              <button
                type="button"
                onClick={loadSanityBanners}
                disabled={loadingBanners}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <i className={`bi bi-arrow-clockwise text-xs ${loadingBanners ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Banner Title *
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Overland Expedition Essentials"
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Target Click URL
                </label>
                <input
                  type="text"
                  value={bannerTargetUrl}
                  onChange={(e) => setBannerTargetUrl(e.target.value)}
                  placeholder="/catalogue or /catalogue?category=lighting"
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Alt Text (Accessibility)
                </label>
                <input
                  type="text"
                  value={bannerAltText}
                  onChange={(e) => setBannerAltText(e.target.value)}
                  placeholder="SHRELL Expedition Equipment"
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={bannerOrder}
                  onChange={(e) => setBannerOrder(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                  }`}
                />
              </div>

              {/* Desktop Image File */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Desktop Banner Image * (Landscape ~16:5 ratio)
                </label>
                <div className={`border border-dashed rounded-lg p-3 transition-colors ${isDark ? 'border-slate-700 bg-slate-950/60 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerDesktopFile(file);
                        setBannerDesktopPreview(URL.createObjectURL(file));
                      }
                    }}
                    className={`block w-full text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono cursor-pointer ${
                      isDark
                        ? 'text-slate-400 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700'
                        : 'text-slate-600 file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300'
                    }`}
                  />
                  {bannerDesktopPreview && (
                    <div className={`mt-3 relative rounded overflow-hidden max-h-36 border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <img src={bannerDesktopPreview} alt="Desktop Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerDesktopFile(null);
                          setBannerDesktopPreview('');
                        }}
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-slate-200 text-[10px] hover:bg-black"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image File */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mobile Banner Image (Optional - falls back to desktop)
                </label>
                <div className={`border border-dashed rounded-lg p-3 transition-colors ${isDark ? 'border-slate-700 bg-slate-950/60 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerMobileFile(file);
                        setBannerMobilePreview(URL.createObjectURL(file));
                      }
                    }}
                    className={`block w-full text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono cursor-pointer ${
                      isDark
                        ? 'text-slate-400 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700'
                        : 'text-slate-600 file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300'
                    }`}
                  />
                  {bannerMobilePreview && (
                    <div className={`mt-3 relative rounded overflow-hidden max-h-36 border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <img src={bannerMobilePreview} alt="Mobile Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerMobileFile(null);
                          setBannerMobilePreview('');
                        }}
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-slate-200 text-[10px] hover:bg-black"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="submit"
                disabled={isUploadingBanner}
                className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-slate-100 hover:bg-white text-slate-950 disabled:opacity-50'
                    : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50'
                }`}
              >
                {isUploadingBanner ? (
                  <>
                    <i className="bi bi-arrow-clockwise text-xs animate-spin" aria-hidden="true" />
                    <span>Uploading Asset &amp; Publishing to Sanity...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg text-xs" aria-hidden="true" />
                    <span>Upload &amp; Publish Banner to Sanity</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Sanity Banners Listing */}
          <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-sm font-bold font-mono flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <i className="bi bi-database text-sm text-slate-400" aria-hidden="true" />
                  <span>Live Sanity Banners ({sanityBanners.length})</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Banners currently fetched live from Sanity CMS via GROQ query.
                </p>
              </div>
            </div>

            {loadingBanners ? (
              <div className={`py-12 flex items-center justify-center gap-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <i className="bi bi-arrow-clockwise text-sm animate-spin text-slate-400" aria-hidden="true" />
                <span>Loading Sanity banners...</span>
              </div>
            ) : sanityBanners.length === 0 ? (
              <div className={`py-12 text-center space-y-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <i className="bi bi-images text-3xl mx-auto block text-slate-400" aria-hidden="true" />
                <p className="text-xs font-mono">No banners found in Sanity CMS yet.</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Use the upload form above to add your first hero banner slide to Sanity!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sanityBanners.map((banner) => (
                  <div
                    key={banner._id}
                    className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-3 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className={`relative rounded overflow-hidden aspect-[16/7] border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
                      }`}>
                        {banner.desktopImageUrl ? (
                          <img
                            src={banner.desktopImageUrl}
                            alt={banner.altText || banner.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            No image preview
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            banner.isActive !== false ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {banner.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-black/70 text-slate-300 text-[10px] font-mono">
                            #{banner.order || 1}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {banner.title || banner.altText || 'Hero Banner'}
                        </div>
                        <div className={`text-[11px] font-mono truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Target: {banner.targetUrl || '/catalogue'}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => handleToggleBanner(banner._id, banner.isActive !== false)}
                        className={`text-[11px] font-mono flex items-center gap-1 transition-colors ${
                          isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {banner.isActive !== false ? (
                          <>
                            <i className="bi bi-eye-slash text-xs text-amber-500" aria-hidden="true" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-eye text-xs text-emerald-500" aria-hidden="true" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner._id)}
                        className="text-[11px] font-mono text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Studio Schemas */}
      {activeTab === 'schemas' && (
        <div className="space-y-6">
          <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-sm font-bold font-mono flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <i className="bi bi-file-earmark-code text-sm text-slate-400" aria-hidden="true" />
                  <span>1. Product Schema (product.ts)</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Drop this file into your Sanity Studio at <code className="font-mono text-emerald-500">schemaTypes/product.ts</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(productSchemaCode, 'product')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                {copiedSchema === 'product' ? (
                  <i className="bi bi-check-lg text-xs text-emerald-500" aria-hidden="true" />
                ) : (
                  <i className="bi bi-copy text-xs" aria-hidden="true" />
                )}
                <span>{copiedSchema === 'product' ? 'Copied!' : 'Copy Schema'}</span>
              </button>
            </div>

            <pre className={`p-4 rounded-lg border text-[11px] font-mono overflow-x-auto max-h-72 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {productSchemaCode}
            </pre>
          </div>

          <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-sm font-bold font-mono flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <i className="bi bi-file-earmark-code text-sm text-slate-400" aria-hidden="true" />
                  <span>2. Hero Banner Schema (banner.ts)</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Drop this file into your Sanity Studio at <code className="font-mono text-emerald-500">schemaTypes/banner.ts</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(bannerSchemaCode, 'banner')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                {copiedSchema === 'banner' ? (
                  <i className="bi bi-check-lg text-xs text-emerald-500" aria-hidden="true" />
                ) : (
                  <i className="bi bi-copy text-xs" aria-hidden="true" />
                )}
                <span>{copiedSchema === 'banner' ? 'Copied!' : 'Copy Schema'}</span>
              </button>
            </div>

            <pre className={`p-4 rounded-lg border text-[11px] font-mono overflow-x-auto max-h-72 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {bannerSchemaCode}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 6: Export Storefront JSON */}
      {activeTab === 'export' && (
        <div className={`border rounded-xl p-5 sm:p-6 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div>
              <h2 className={`text-sm font-bold font-mono uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Export Storefront Products for Sanity Dataset Import
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                You can copy this dataset to import all 12 initial storefront products into Sanity using the CLI:
                <code className="block mt-1 font-mono text-emerald-500">npx sanity dataset import products.ndjson production</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const ndjson = INITIAL_PRODUCTS
                  .map((p: any) =>
                    JSON.stringify({
                      _type: 'product',
                      _id: `prod-${p.id}`,
                      name: p.name,
                      slug: { _type: 'slug', current: p.slug },
                      price: Math.round(p.pricePaisa / 100),
                      salePrice: p.compareAtPricePaisa ? Math.round(p.compareAtPricePaisa / 100) : undefined,
                      description: p.description,
                      inStock: p.stockQuantity > 0,
                      isFeatured: p.isFeatured,
                    })
                  )
                  .join('\n');
                copyToClipboard(ndjson, 'ndjson');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'bg-slate-100 hover:bg-white text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiedSchema === 'ndjson' ? (
                <i className="bi bi-check-lg text-xs text-emerald-500" aria-hidden="true" />
              ) : (
                <i className="bi bi-copy text-xs" aria-hidden="true" />
              )}
              <span>{copiedSchema === 'ndjson' ? 'Copied NDJSON!' : 'Copy NDJSON'}</span>
            </button>
          </div>

          <pre className={`p-4 rounded-lg border text-[10px] font-mono overflow-x-auto max-h-96 ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {INITIAL_PRODUCTS
              .slice(0, 3)
              .map((p: any) =>
                JSON.stringify(
                  {
                    _type: 'product',
                    _id: `prod-${p.id}`,
                    name: p.name,
                    slug: { _type: 'slug', current: p.slug },
                    price: Math.round(p.pricePaisa / 100),
                    salePrice: p.compareAtPricePaisa ? Math.round(p.compareAtPricePaisa / 100) : undefined,
                    description: p.description,
                    inStock: p.stockQuantity > 0,
                    isFeatured: p.isFeatured,
                  },
                  null,
                  2
                )
              )
              .join('\n\n')}
          </pre>
        </div>
      )}
    </div>
  );
};
