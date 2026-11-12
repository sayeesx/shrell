import React, { useEffect, useState } from 'react';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { settingsRepository } from '../../infrastructure/repositories';
import { cloudinaryService } from '../../infrastructure/cloudinary/cloudinaryService';
import { formatBytes, optimizeImageFile } from '../../utils/imageOptimizer';
import { paisaToRupees, rupeesToPaisa } from '../../domain/services/CurrencyService';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useCart } from '../../application/CartContext';
import { useTheme } from '../../application/ThemeContext';

const DEFAULT_OG_IMAGE = '/shrell-opengraph.png';

export const AdminSettings: React.FC = () => {
  const { finishPageLoad } = useNavigationLoading();
  const { refreshSettings } = useCart();
  const { isDark } = useTheme();
  const [storeName, setStoreName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeUpiId, setStoreUpiId] = useState('');
  const [storeUpiName, setStoreUpiName] = useState('');
  const [freeShippingRupees, setFreeShippingRupees] = useState('');
  const [standardShippingRupees, setStandardShippingRupees] = useState('');
  const [gstRate, setGstRate] = useState('');

  // OpenGraph CDN & Social Share Fields
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState(DEFAULT_OG_IMAGE);
  const [ogImageAlt, setOgImageAlt] = useState('');
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [ogUploadError, setOgUploadError] = useState('');
  const [ogUploadStats, setOgUploadStats] = useState('');

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await settingsRepository.getSettings();
        setStoreName(s.storeName);
        setContactEmail(s.contactEmail);
        setContactPhone(s.contactPhone);
        setWhatsappNumber(s.whatsappSupportNumber);
        setStoreUpiId(s.storeUpiId);
        setStoreUpiName(s.storeUpiName);
        setFreeShippingRupees(paisaToRupees(s.freeShippingThresholdPaisa).toString());
        setStandardShippingRupees(paisaToRupees(s.standardShippingPaisa).toString());
        setGstRate(s.gstRatePercent.toString());
        setOgTitle(s.ogTitle || 'SHRELL Automotive | Premium Car Accessories in India');
        setOgDescription(
          s.ogDescription ||
            'Shop premium car accessories and touring equipment for Indian vehicles. OSRAM auxiliary lighting, aerodynamic crossbars, 7D floor liners, and heavy-duty 12V tyre inflators.'
        );
        setOgImageUrl(s.ogImageUrl || DEFAULT_OG_IMAGE);
        setOgImageAlt(s.ogImageAlt || 'SHRELL Automotive - Premium Car Accessories & Touring Equipment');
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
        finishPageLoad();
      }
    }
    load();
  }, []);

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOgImage(true);
    setOgUploadError('');
    setOgUploadStats('');
    try {
      let uploadFile = file;
      if (file.type !== 'image/svg+xml') {
        const optimized = await optimizeImageFile(file, {
          maxDimension: 1200,
          targetAspectRatio: 1200 / 630,
          targetMaxBytes: 120 * 1024,
          format: 'image/jpeg',
          fileNameBase: 'shrell-opengraph',
        });
        URL.revokeObjectURL(optimized.previewUrl);
        uploadFile = optimized.file;
        setOgUploadStats(
          `Optimized 1200x630 JPEG: ${formatBytes(file.size)} -> ${formatBytes(optimized.compressedBytes)}`
        );
      }

      const result = await cloudinaryService.uploadImage(uploadFile, {
        maxSizeBytes: 8 * 1024 * 1024,
        assetFolder: 'shrell/opengraph',
        tags: 'opengraph',
      });
      if (result && result.url) {
        const cleanUrl = result.url.startsWith('http://res.cloudinary.com/')
          ? result.url.replace(/^http:\/\/res\.cloudinary\.com\//, 'https://res.cloudinary.com/')
          : result.url;
        setOgImageUrl(cleanUrl);
      }
    } catch (err: any) {
      setOgUploadError(err.message || 'OpenGraph image upload failed. Try again or enter a CDN URL manually.');
    } finally {
      setUploadingOgImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanOgUrl = ogImageUrl.trim().startsWith('http://res.cloudinary.com/')
        ? ogImageUrl.trim().replace(/^http:\/\/res\.cloudinary\.com\//, 'https://res.cloudinary.com/')
        : ogImageUrl.trim() || DEFAULT_OG_IMAGE;

      await settingsRepository.updateSettings({
        storeName,
        contactEmail,
        contactPhone,
        whatsappSupportNumber: whatsappNumber,
        storeUpiId,
        storeUpiName,
        freeShippingThresholdPaisa: rupeesToPaisa(Number(freeShippingRupees)),
        standardShippingPaisa: rupeesToPaisa(Number(standardShippingRupees)),
        gstRatePercent: Number(gstRate),
        ogTitle: ogTitle.trim(),
        ogDescription: ogDescription.trim(),
        ogImageUrl: cleanOgUrl,
        ogImageAlt: ogImageAlt.trim(),
      });
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <ShrellLoader size={56} />
      </div>
    );
  }

  const inputCls = `w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
    isDark
      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
  }`;
  const labelCls = `block uppercase mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`;
  const sectionHeadCls = `text-xs uppercase tracking-wider font-bold border-b pb-2 ${isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-200'}`;

  return (
    <div className="space-y-6 w-full">
      <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          COMMERCE SETTINGS & TAX RULES
        </h1>
        <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Store parameters, UPI payment handles, GST rates and shipping rules
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <i className="bi bi-check-lg text-sm" aria-hidden="true" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className={`p-6 rounded-xl border space-y-6 text-xs font-mono shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="space-y-4">
          <h2 className={sectionHeadCls}>Store Identity &amp; Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Store Name', type: 'text', value: storeName, onChange: setStoreName },
              { label: 'Contact Email', type: 'email', value: contactEmail, onChange: setContactEmail },
              { label: 'Support Phone', type: 'text', value: contactPhone, onChange: setContactPhone },
              { label: 'WhatsApp Support Number (E.164 no +)', type: 'text', value: whatsappNumber, onChange: setWhatsappNumber },
            ].map((field) => (
              <div key={field.label}>
                <label className={labelCls}>{field.label}</label>
                <input type={field.type} required value={field.value}
                  onChange={(e) => field.onChange(e.target.value)} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className={sectionHeadCls}>Direct UPI Payment Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Store UPI VPA Handle</label>
              <input type="text" required value={storeUpiId} onChange={(e) => setStoreUpiId(e.target.value)}
                placeholder="e.g. shrell@icici" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Registered Merchant Name</label>
              <input type="text" required value={storeUpiName} onChange={(e) => setStoreUpiName(e.target.value)}
                placeholder="e.g. SHRELL Automotive India Pvt Ltd" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className={sectionHeadCls}>Shipping Thresholds &amp; Tax Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Free Shipping Min (INR)</label>
              <input type="number" required value={freeShippingRupees} onChange={(e) => setFreeShippingRupees(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Standard Shipping Fee (INR)</label>
              <input type="number" required value={standardShippingRupees} onChange={(e) => setStandardShippingRupees(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Applicable GST Rate (%)</label>
              <input type="number" required value={gstRate} onChange={(e) => setGstRate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
            <h2 className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              OpenGraph &amp; Social Share Preview (CDN)
            </h2>
            {ogImageUrl !== DEFAULT_OG_IMAGE && (
              <button
                type="button"
                onClick={() => setOgImageUrl(DEFAULT_OG_IMAGE)}
                className="text-[11px] font-mono text-rose-500 hover:underline cursor-pointer"
              >
                Reset Default Image
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* OpenGraph CDN Image Upload & URL */}
            <div className="md:col-span-6 space-y-2.5">
              <label className={labelCls}>OpenGraph Image (Upload to Cloudinary CDN)</label>
              <div
                className={`p-3 rounded-lg border-2 border-dashed transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-950/60 hover:border-slate-500' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}
              >
                {uploadingOgImage ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] text-slate-400">Uploading OpenGraph image to CDN...</span>
                  </div>
                ) : (
                  <label className="py-2 flex flex-col items-center justify-center cursor-pointer text-center gap-1">
                    <i className={`bi bi-cloud-arrow-up text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden="true" />
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Click to upload OpenGraph banner (1200×630 recommended)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Uploads to CDN and updates meta og:image / twitter:image
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleOgImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {ogUploadError && (
                <div className="text-[11px] text-rose-500 p-2 rounded bg-rose-500/10 border border-rose-500/30">
                  {ogUploadError}
                </div>
              )}

              {ogUploadStats && (
                <div className="text-[11px] font-mono text-emerald-500 p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
                  {ogUploadStats}
                </div>
              )}

              <div>
                <label htmlFor="og-image-url" className={labelCls}>OpenGraph Image CDN URL</label>
                <input
                  id="og-image-url"
                  type="text"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or /shrell-opengraph.png"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="og-image-alt" className={labelCls}>OpenGraph Image Alt Text</label>
                <input
                  id="og-image-alt"
                  type="text"
                  value={ogImageAlt}
                  onChange={(e) => setOgImageAlt(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Live Social Link Card Preview */}
            <div className="md:col-span-6 space-y-2">
              <span className={labelCls}>Live OpenGraph Preview</span>
              <div
                className={`rounded-xl border overflow-hidden ${
                  isDark ? 'bg-slate-950 border-slate-700' : 'bg-[#F5F3EE] border-slate-300'
                }`}
              >
                <div className="aspect-[1200/630] w-full bg-black/20 overflow-hidden flex items-center justify-center">
                  <img
                    src={ogImageUrl || DEFAULT_OG_IMAGE}
                    alt={ogImageAlt || 'OpenGraph preview'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_OG_IMAGE;
                    }}
                  />
                </div>
                <div className="p-3 space-y-1 font-sans">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    shrell.vercel.app
                  </div>
                  <div className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {ogTitle || 'SHRELL Automotive | Premium Car Accessories in India'}
                  </div>
                  <div className={`text-[11px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {ogDescription || 'Shop premium car accessories and touring equipment for Indian vehicles.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-1">
            <div>
              <label htmlFor="og-title" className={labelCls}>OpenGraph Title</label>
              <input
                id="og-title"
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="og-description" className={labelCls}>OpenGraph Description</label>
              <textarea
                id="og-description"
                rows={2}
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button type="submit"
            className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm">
            <i className="bi bi-floppy text-sm" aria-hidden="true" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
