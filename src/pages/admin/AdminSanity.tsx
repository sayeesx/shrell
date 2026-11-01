import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Plus,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  FileCode,
  Package,
} from 'lucide-react';
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

export const AdminSanity: React.FC = () => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-800/80 flex items-center justify-center text-red-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-100">
              Sanity CMS Integration Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Connect Sanity Headless CMS for live product catalogue, image management, and real-time storefront synchronization.
          </p>
        </div>

        {/* Studio Link Button */}
        {studioUrl && (
          <a
            href={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-800 hover:bg-surface-750 text-slate-200 border border-surface-700 text-xs font-mono font-semibold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
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
              ? 'bg-red-950/40 border-red-800/80 text-red-300'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
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
        <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              testResult?.success
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
                : 'bg-surface-950 border border-surface-700 text-slate-400'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Sanity Status</div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
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
        <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-950 border border-surface-700 flex items-center justify-center flex-shrink-0 text-red-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Sanity Products</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
              {testResult?.productCount !== undefined ? testResult.productCount : '0 (Local: 12)'}
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-950 border border-surface-700 flex items-center justify-center flex-shrink-0 text-brand-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">API Latency</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
              {testResult?.latencyMs ? `${testResult.latencyMs}ms` : 'Instant cache'}
            </div>
          </div>
        </div>

        {/* Active Dataset */}
        <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-950 border border-surface-700 flex items-center justify-center flex-shrink-0 text-slate-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Dataset / Project</div>
            <div className="text-xs font-bold text-slate-100 mt-0.5 font-mono truncate max-w-[130px]">
              {config.projectId ? `${config.dataset} (${config.projectId})` : 'Not configured'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-surface-800 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Products &amp; Photos ({sanityProducts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'create'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Hero Banners ({sanityBanners.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schemas')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'schemas'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Studio Schemas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'export'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Export Storefront JSON
        </button>
      </div>

      {/* TAB 1: Configuration */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="space-y-5 bg-surface-900 border border-surface-800 rounded-xl p-5 sm:p-6">
          <div className="border-b border-surface-800 pb-4">
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">
              Sanity Connection Credentials
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Find your Project ID and API tokens in the{' '}
              <a
                href="https://www.sanity.io/manage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Sanity Management Console
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">
                1. Project ID *
              </label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                placeholder="e.g. o0g8w9v2"
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Found in project settings or sanity.config.ts
              </span>
            </div>

            {/* Dataset */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">
                2. Dataset *
              </label>
              <input
                type="text"
                value={config.dataset}
                onChange={(e) => setConfig({ ...config, dataset: e.target.value })}
                placeholder="production"
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Standard default dataset name is "production"
              </span>
            </div>

            {/* API Version */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">
                3. API Version
              </label>
              <input
                type="text"
                value={config.apiVersion}
                onChange={(e) => setConfig({ ...config, apiVersion: e.target.value })}
                placeholder="2024-01-01"
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Recommended: 2024-01-01 (ISO date format)
              </span>
            </div>

            {/* Studio URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">
                4. Sanity Studio URL (Optional)
              </label>
              <input
                type="text"
                value={config.studioUrl || ''}
                onChange={(e) => setConfig({ ...config, studioUrl: e.target.value })}
                placeholder="https://your-studio.sanity.studio or http://localhost:3333"
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Link to your deployed Sanity Studio
              </span>
            </div>

            {/* API Token (Optional) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-mono font-semibold text-slate-300">
                5. Sanity API Token (Optional for write mutations &amp; private datasets)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.token || ''}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="sk..."
                  className="w-full px-3 py-2 pr-10 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Only needed if your dataset is private or if you wish to create products directly from this portal.
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-surface-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetConfig}
              className="px-3.5 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-400 text-xs font-mono"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 text-xs font-mono font-semibold flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-mono font-bold transition-colors"
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
          <div className="flex items-center justify-between bg-surface-900 border border-surface-800 rounded-xl p-4">
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100">
                Live Sanity Catalogue
              </h2>
              <p className="text-xs text-slate-400">
                Products and photos dynamically loaded from your Sanity project.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSanityProducts}
              disabled={loadingProducts}
              className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingProducts ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono bg-surface-900 border border-surface-800 rounded-xl">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-400 mb-2" />
              <span>Querying Sanity GROQ endpoints...</span>
            </div>
          ) : sanityProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sanityProducts.map((p) => (
                <div
                  key={p._id}
                  className="rounded-xl bg-surface-900 border border-surface-800 overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-video bg-surface-950 flex items-center justify-center overflow-hidden border-b border-surface-800 relative">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-600">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[10px] font-mono">No Image Asset</span>
                      </div>
                    )}
                    {p.isFeatured && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500 text-white">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{p.categoryName || p.category || 'Automotive'}</span>
                      <span className="text-emerald-400 font-semibold">
                        ₹{(p.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {p.description || 'No description provided in Sanity document.'}
                    </p>

                    <div className="pt-2 border-t border-surface-800 text-[10px] font-mono text-slate-500 truncate">
                      ID: {p._id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-900 border border-surface-800 rounded-xl space-y-3">
              <Package className="w-8 h-8 mx-auto text-slate-500" />
              <h3 className="text-sm font-bold text-slate-200">No Sanity Products Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No documents of type <code className="text-brand-400">product</code> exist in your dataset yet. You can create one right now using the Quick Add tab or import the existing store items.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-mono font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Product</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Quick Add Product */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateProduct} className="bg-surface-900 border border-surface-800 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="border-b border-surface-800 pb-4">
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">
              Create New Product in Sanity
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Publishes directly into your Sanity dataset using the Sanity Mutations API. Requires an API write token.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">Product Title *</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. SHRELL 4K Dual Sensor Dash Cam"
                required
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-sans text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">URL Slug *</label>
              <input
                type="text"
                value={newProductSlug}
                onChange={(e) => setNewProductSlug(e.target.value)}
                placeholder="shrell-4k-dual-sensor-dash-cam"
                required
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">Price (INR ₹) *</label>
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="4999"
                required
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">Compare-At / Strikethrough Price (INR ₹)</label>
              <input
                type="number"
                value={newProductSalePrice}
                onChange={(e) => setNewProductSalePrice(e.target.value)}
                placeholder="6499"
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300">Category</label>
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="lighting">LED Headlamps &amp; Bulbs</option>
                <option value="dashcam">4K Dash Cams &amp; Sensors</option>
                <option value="interior">Interior Seat Covers &amp; Mats</option>
                <option value="freshners">Car Perfumes &amp; Freshners</option>
                <option value="cleaning">Car Care &amp; Detailing</option>
                <option value="tyre">Tyre Care &amp; Inflators</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-mono font-semibold text-slate-300">Product Description</label>
              <textarea
                value={newProductDesc}
                onChange={(e) => setNewProductDesc(e.target.value)}
                rows={3}
                placeholder="Provide specs, fitment information, and key features..."
                className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-sans text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-800 flex justify-end">
            <button
              type="submit"
              disabled={isCreatingProduct}
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-mono font-bold flex items-center gap-2"
            >
              {isCreatingProduct ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing to Sanity...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
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
          <form onSubmit={handleCreateBanner} className="space-y-5 bg-surface-900 border border-surface-800 rounded-xl p-5 sm:p-6">
            <div className="border-b border-surface-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-400" />
                  <span>Upload Hero Banner to Sanity CMS</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload desktop and mobile banner assets directly to Sanity Asset CDN and publish live hero slides.
                </p>
              </div>

              <button
                type="button"
                onClick={loadSanityBanners}
                disabled={loadingBanners}
                className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-750 text-slate-200 border border-surface-700 text-xs font-mono flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBanners ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Banner Title *
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Overland Expedition Essentials"
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Target Click URL
                </label>
                <input
                  type="text"
                  value={bannerTargetUrl}
                  onChange={(e) => setBannerTargetUrl(e.target.value)}
                  placeholder="/catalogue or /catalogue?category=lighting"
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Alt Text (Accessibility)
                </label>
                <input
                  type="text"
                  value={bannerAltText}
                  onChange={(e) => setBannerAltText(e.target.value)}
                  placeholder="SHRELL Expedition Equipment"
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={bannerOrder}
                  onChange={(e) => setBannerOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Desktop Image File */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Desktop Banner Image * (Landscape ~16:5 ratio)
                </label>
                <div className="border border-dashed border-surface-700 rounded-lg p-3 bg-surface-950/60 hover:border-surface-600 transition-colors">
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
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:bg-surface-800 file:text-slate-200 hover:file:bg-surface-750 cursor-pointer"
                  />
                  {bannerDesktopPreview && (
                    <div className="mt-3 relative rounded overflow-hidden max-h-36 bg-surface-950 border border-surface-800">
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
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Mobile Banner Image (Optional - falls back to desktop)
                </label>
                <div className="border border-dashed border-surface-700 rounded-lg p-3 bg-surface-950/60 hover:border-surface-600 transition-colors">
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
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:bg-surface-800 file:text-slate-200 hover:file:bg-surface-750 cursor-pointer"
                  />
                  {bannerMobilePreview && (
                    <div className="mt-3 relative rounded overflow-hidden max-h-36 bg-surface-950 border border-surface-800">
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

            <div className="pt-4 border-t border-surface-800 flex justify-end">
              <button
                type="submit"
                disabled={isUploadingBanner}
                className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isUploadingBanner ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Asset &amp; Publishing to Sanity...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload &amp; Publish Banner to Sanity</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Sanity Banners Listing */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  <span>Live Sanity Banners ({sanityBanners.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Banners currently fetched live from Sanity CMS via GROQ query.
                </p>
              </div>
            </div>

            {loadingBanners ? (
              <div className="py-12 flex items-center justify-center gap-3 text-slate-400 text-xs font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                <span>Loading Sanity banners...</span>
              </div>
            ) : sanityBanners.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-mono">No banners found in Sanity CMS yet.</p>
                <p className="text-[11px] text-slate-500">
                  Use the upload form above to add your first hero banner slide to Sanity!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sanityBanners.map((banner) => (
                  <div
                    key={banner._id}
                    className="p-3.5 rounded-lg bg-surface-950 border border-surface-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="relative rounded overflow-hidden aspect-[16/7] bg-surface-900 border border-surface-800">
                        {banner.desktopImageUrl ? (
                          <img
                            src={banner.desktopImageUrl}
                            alt={banner.altText || banner.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                            No image preview
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            banner.isActive !== false ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                          }`}>
                            {banner.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-black/70 text-slate-300 text-[10px] font-mono">
                            #{banner.order || 1}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-100 truncate">
                          {banner.title || banner.altText || 'Hero Banner'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                          Target: {banner.targetUrl || '/catalogue'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-surface-800/60">
                      <button
                        type="button"
                        onClick={() => handleToggleBanner(banner._id, banner.isActive !== false)}
                        className="text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {banner.isActive !== false ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner._id)}
                        className="text-[11px] font-mono text-red-400 hover:text-red-300 transition-colors"
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
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-brand-400" />
                  <span>1. Product Schema (product.ts)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drop this file into your Sanity Studio at <code className="text-brand-400">schemaTypes/product.ts</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(productSchemaCode, 'product')}
                className="px-3 py-1.5 rounded-md bg-surface-800 hover:bg-surface-750 text-slate-200 border border-surface-700 text-xs font-mono flex items-center gap-1.5"
              >
                {copiedSchema === 'product' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema === 'product' ? 'Copied!' : 'Copy Schema'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-surface-950 border border-surface-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {productSchemaCode}
            </pre>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-brand-400" />
                  <span>2. Hero Banner Schema (banner.ts)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drop this file into your Sanity Studio at <code className="text-brand-400">schemaTypes/banner.ts</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(bannerSchemaCode, 'banner')}
                className="px-3 py-1.5 rounded-md bg-surface-800 hover:bg-surface-750 text-slate-200 border border-surface-700 text-xs font-mono flex items-center gap-1.5"
              >
                {copiedSchema === 'banner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema === 'banner' ? 'Copied!' : 'Copy Schema'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-surface-950 border border-surface-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {bannerSchemaCode}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: Export Storefront JSON */}
      {activeTab === 'export' && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-800 pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">
                Export Storefront Products for Sanity Dataset Import
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                You can copy this dataset to import all 12 initial storefront products into Sanity using the CLI:
                <code className="block mt-1 text-brand-400">npx sanity dataset import products.ndjson production</code>
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
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5"
            >
              {copiedSchema === 'ndjson' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema === 'ndjson' ? 'Copied NDJSON!' : 'Copy NDJSON'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-lg bg-surface-950 border border-surface-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-96">
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
