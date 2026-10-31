import React, { useEffect, useState, useRef } from 'react';
import { HeroBanner } from '../../domain/types';
import { bannerRepository } from '../../infrastructure/repositories';
import { cloudinaryService } from '../../infrastructure/cloudinary/cloudinaryService';

interface CropModalState {
  isOpen: boolean;
  target: 'desktop' | 'mobile';
  imageUrl: string;
  originalFile: File | null;
}

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('/catalogue');
  const [altText, setAltText] = useState<string>('');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [uploading, setUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Crop Modal States
  const [cropModal, setCropModal] = useState<CropModalState>({
    isOpen: false,
    target: 'desktop',
    imageUrl: '',
    originalFile: null,
  });
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 5); // default desktop ~3.2:1
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const isCloudinaryActive = cloudinaryService.isConfigured();

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannerRepository.getAllForAdmin();
      setBanners(data);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopFile(file);
      const url = URL.createObjectURL(file);
      setDesktopPreview(url);
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileFile(file);
      const url = URL.createObjectURL(file);
      setMobilePreview(url);
    }
  };

  // Open Crop Modal
  const openCropper = (target: 'desktop' | 'mobile') => {
    const url = target === 'desktop' ? desktopPreview : mobilePreview;
    const file = target === 'desktop' ? desktopFile : mobileFile;
    if (!url) return;

    setCropModal({
      isOpen: true,
      target,
      imageUrl: url,
      originalFile: file,
    });
    setAspectRatio(target === 'desktop' ? 16 / 5 : 16 / 9);
    setZoom(1);
    setPanX(0);
    setPanY(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      imageObjRef.current = img;
      renderCanvas(img, target === 'desktop' ? 16 / 5 : 16 / 9, 1, 0, 0);
    };
  };

  // Render Canvas based on crop settings
  const renderCanvas = (
    img: HTMLImageElement,
    ratio: number,
    curZoom: number,
    offsetX: number,
    offsetY: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseWidth = 800;
    const baseHeight = Math.round(baseWidth / ratio);
    canvas.width = baseWidth;
    canvas.height = baseHeight;

    ctx.clearRect(0, 0, baseWidth, baseHeight);

    // Calculate source bounds to maintain aspect ratio and fit
    const imgRatio = img.width / img.height;
    let sWidth = img.width;
    let sHeight = img.height;

    if (imgRatio > ratio) {
      sWidth = img.height * ratio;
    } else {
      sHeight = img.width / ratio;
    }

    // Apply zoom
    sWidth = sWidth / curZoom;
    sHeight = sHeight / curZoom;

    // Apply pan offset (normalize -100 to 100 percentage of max scrollable distance)
    const maxShiftX = (img.width - sWidth) / 2;
    const maxShiftY = (img.height - sHeight) / 2;
    const sx = Math.max(0, Math.min(img.width - sWidth, (img.width - sWidth) / 2 + (offsetX / 100) * maxShiftX));
    const sy = Math.max(0, Math.min(img.height - sHeight, (img.height - sHeight) / 2 + (offsetY / 100) * maxShiftY));

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, baseWidth, baseHeight);
  };

  useEffect(() => {
    if (cropModal.isOpen && imageObjRef.current) {
      renderCanvas(imageObjRef.current, aspectRatio, zoom, panX, panY);
    }
  }, [aspectRatio, zoom, panX, panY, cropModal.isOpen]);

  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = `${cropModal.target}-banner-cropped.png`;
      const croppedFile = new File([blob], fileName, { type: 'image/png' });
      const croppedUrl = URL.createObjectURL(blob);

      if (cropModal.target === 'desktop') {
        setDesktopFile(croppedFile);
        setDesktopPreview(croppedUrl);
      } else {
        setMobileFile(croppedFile);
        setMobilePreview(croppedUrl);
      }

      setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null });
      setStatusMessage({ text: `Custom crop applied for ${cropModal.target} banner!`, isError: false });
    }, 'image/png');
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desktopFile && !desktopPreview) {
      setStatusMessage({ text: 'Please select a desktop banner image.', isError: true });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      let uploadedDesktopUrl = desktopPreview;
      let uploadedMobileUrl = mobilePreview;

      // 1. Upload Desktop image via Cloudinary service (no compression, no bg removal)
      if (desktopFile) {
        const result = await cloudinaryService.uploadImage(desktopFile);
        uploadedDesktopUrl = result.url;
      }

      // 2. Upload Mobile image if provided
      if (mobileFile) {
        const result = await cloudinaryService.uploadImage(mobileFile);
        uploadedMobileUrl = result.url;
      }

      // 3. Save to repository
      await bannerRepository.create({
        desktopImageUrl: uploadedDesktopUrl,
        mobileImageUrl: uploadedMobileUrl || uploadedDesktopUrl,
        targetUrl: targetUrl.trim() || '/catalogue',
        altText: altText.trim() || 'Hero Banner',
        order: Number(order) || 1,
        isActive,
      });

      setStatusMessage({ text: 'Hero banner added successfully!', isError: false });
      setIsAdding(false);
      // Reset form
      setDesktopFile(null);
      setDesktopPreview('');
      setMobileFile(null);
      setMobilePreview('');
      setTargetUrl('/catalogue');
      setAltText('');
      setOrder(banners.length + 2);
      await loadBanners();
    } catch (err: any) {
      console.error('Failed to upload/create banner:', err);
      setStatusMessage({ text: err.message || 'Failed to upload banner. Please retry.', isError: true });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      await bannerRepository.update(banner.id, { isActive: !banner.isActive });
      await loadBanners();
    } catch (err) {
      console.error('Failed to update banner:', err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hero banner?')) return;
    try {
      await bannerRepository.delete(id);
      await loadBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
            Hero Carousel Banners
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload custom cropped banners for desktop &amp; mobile with page navigation links. Background transparency preserved.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setStatusMessage(null);
          }}
          className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <i className={`bi ${isAdding ? 'bi-x-lg' : 'bi-plus-lg'} text-sm`}></i>
          <span>{isAdding ? 'Close Uploader' : 'Add New Banner'}</span>
        </button>
      </div>

      {/* Cloudinary Status Banner */}
      <div className="p-4 rounded-lg bg-surface-900 border border-surface-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <i className="bi bi-cloud-arrow-up text-brand-400 text-lg"></i>
          <div>
            <div className="text-slate-200 font-semibold">
              Cloudinary Media Storage:{' '}
              {isCloudinaryActive ? (
                <span className="text-emerald-400">Connected &amp; Active</span>
              ) : (
                <span className="text-amber-400">Ready for credentials in .env</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Images will be stored exactly as uploaded without background removal or lossy compression.
            </p>
          </div>
        </div>

        {!isCloudinaryActive && (
          <span className="text-[10px] font-mono bg-surface-950 px-2.5 py-1 rounded-md border border-surface-800 text-slate-300">
            VITE_CLOUDINARY_CLOUD_NAME in .env
          </span>
        )}
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium ${
            statusMessage.isError
              ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
              : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Add New Banner Form Drawer */}
      {isAdding && (
        <form onSubmit={handleCreateBanner} className="p-6 rounded-lg bg-surface-900 border border-surface-700 space-y-6">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono border-b border-surface-800 pb-2">
            Upload &amp; Custom Crop Hero Banner
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Banner Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  1. Desktop Banner Image *
                </label>
                {desktopPreview && (
                  <button
                    type="button"
                    onClick={() => openCropper('desktop')}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <i className="bi bi-crop"></i>
                    <span>Crop for Desktop</span>
                  </button>
                )}
              </div>
              <div className="border-2 border-dashed border-surface-700 hover:border-brand-500 rounded-lg p-4 text-center bg-surface-950 transition-colors">
                {desktopPreview ? (
                  <div className="space-y-2.5">
                    <img
                      src={desktopPreview}
                      alt="Desktop Preview"
                      className="max-h-36 mx-auto object-contain rounded-md"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <label className="text-xs text-brand-400 hover:underline cursor-pointer">
                        Change File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDesktopFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openCropper('desktop')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-surface-800 hover:bg-surface-700 text-slate-200 flex items-center gap-1"
                      >
                        <i className="bi bi-crop text-brand-400"></i>
                        <span>Crop Banner</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-2">
                    <i className="bi bi-display text-2xl text-slate-400"></i>
                    <div className="text-xs text-slate-300 font-medium">Click to select Desktop Banner</div>
                    <div className="text-[10px] text-slate-500">PNG / WebP with transparency supported</div>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleDesktopFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Mobile Banner Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  2. Mobile Banner Image (Optional)
                </label>
                {mobilePreview && (
                  <button
                    type="button"
                    onClick={() => openCropper('mobile')}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <i className="bi bi-crop"></i>
                    <span>Crop for Mobile</span>
                  </button>
                )}
              </div>
              <div className="border-2 border-dashed border-surface-700 hover:border-brand-500 rounded-lg p-4 text-center bg-surface-950 transition-colors">
                {mobilePreview ? (
                  <div className="space-y-2.5">
                    <img
                      src={mobilePreview}
                      alt="Mobile Preview"
                      className="max-h-36 mx-auto object-contain rounded-md"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <label className="text-xs text-brand-400 hover:underline cursor-pointer">
                        Change File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMobileFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openCropper('mobile')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-surface-800 hover:bg-surface-700 text-slate-200 flex items-center gap-1"
                      >
                        <i className="bi bi-crop text-brand-400"></i>
                        <span>Crop Banner</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-2">
                    <i className="bi bi-phone text-2xl text-slate-400"></i>
                    <div className="text-xs text-slate-300 font-medium">Click to select Mobile Banner</div>
                    <div className="text-[10px] text-slate-500">Falls back to desktop banner if not provided</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMobileFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Link & Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2">
              <label htmlFor="banner-target-url" className="block text-xs font-semibold text-slate-300 mb-1">
                Target Page Navigation URL (where clicking this banner will navigate) *
              </label>
              <input
                id="banner-target-url"
                type="text"
                required
                placeholder="e.g. /catalogue or /catalogue?category=roof-racks-cargo"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label htmlFor="banner-order" className="block text-xs font-semibold text-slate-300 mb-1">
                Carousel Order (1, 2, 3...)
              </label>
              <input
                id="banner-order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="banner-alt" className="block text-xs font-semibold text-slate-300 mb-1">
                Alt Text / Title (Accessibility)
              </label>
              <input
                id="banner-alt"
                type="text"
                placeholder="e.g. Festival Season Car Care Deals"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-surface-700 text-brand-500 w-4 h-4"
                />
                <span>Active on Storefront</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              {uploading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-up text-sm"></i>
                  <span>Publish Banner</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Banners List */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
          Current Carousel Slides ({banners.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 rounded-lg bg-surface-900 border border-surface-700 text-center text-xs text-slate-400">
            No banners created yet. Click &quot;Add New Banner&quot; above to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-lg bg-surface-900 border border-surface-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Thumbnails */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-40 h-20 rounded-md bg-surface-950 border border-surface-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src={b.desktopImageUrl}
                      alt={b.altText || 'Desktop Banner'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {b.mobileImageUrl && b.mobileImageUrl !== b.desktopImageUrl && (
                    <div className="w-16 h-20 rounded-md bg-surface-950 border border-surface-800 overflow-hidden flex-shrink-0 hidden sm:flex items-center justify-center">
                      <img
                        src={b.mobileImageUrl}
                        alt="Mobile Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 font-mono">
                        Slide #{b.order}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          b.isActive
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-surface-800 text-slate-400 border border-surface-700'
                        }`}
                      >
                        {b.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    <div className="text-xs text-brand-400 font-mono">
                      Target Link: <span className="underline">{b.targetUrl}</span>
                    </div>

                    {b.altText && (
                      <div className="text-[11px] text-slate-400">
                        Title: {b.altText}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className="px-3 py-1.5 rounded-md bg-surface-800 hover:bg-surface-750 text-xs font-mono text-slate-200 transition-colors"
                  >
                    {b.isActive ? 'Hide' : 'Show'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(b.id)}
                    className="p-1.5 rounded-md bg-surface-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete banner"
                  >
                    <i className="bi bi-trash3 text-sm"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* INTERACTIVE CROPPER MODAL (Desktop & Mobile Custom Ratio & Preview) */}
      {/* =================================================================== */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-lg max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div className="flex items-center gap-2">
                <i className="bi bi-crop text-brand-400 text-lg"></i>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Crop Banner for {cropModal.target === 'desktop' ? 'Desktop' : 'Mobile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null })}
                className="text-slate-400 hover:text-white"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Aspect Ratio Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Aspect Ratio Preset</label>
              <div className="flex flex-wrap gap-2">
                {cropModal.target === 'desktop' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(16 / 5)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${
                        Math.abs(aspectRatio - 16 / 5) < 0.05
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                      }`}
                    >
                      16:5 (Ultrawide Banner)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(16 / 9)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${
                        Math.abs(aspectRatio - 16 / 9) < 0.05
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                      }`}
                    >
                      16:9 (Standard Widescreen)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(21 / 9)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${
                        Math.abs(aspectRatio - 21 / 9) < 0.05
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                      }`}
                    >
                      21:9 (Panoramic)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(16 / 9)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${
                        Math.abs(aspectRatio - 16 / 9) < 0.05
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                      }`}
                    >
                      16:9 (Mobile Banner)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(4 / 3)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${
                        Math.abs(aspectRatio - 4 / 3) < 0.05
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                      }`}
                    >
                      4:3 (Taller Card)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(1)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${
                        Math.abs(aspectRatio - 1) < 0.05
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                      }`}
                    >
                      1:1 (Square)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Canvas Preview Area */}
            <div className="bg-surface-950 p-3 rounded-lg border border-surface-800 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[300px] object-contain rounded border border-surface-700"
              />
            </div>

            {/* Adjustments: Zoom & Pan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Zoom</span>
                  <span className="font-mono text-slate-400">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Pan X</span>
                  <span className="font-mono text-slate-400">{panX}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={panX}
                  onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Pan Y</span>
                  <span className="font-mono text-slate-400">{panY}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={panY}
                  onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-surface-800">
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPanX(0);
                  setPanY(0);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Reset Crop</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null })}
                  className="px-4 py-2 rounded-md bg-surface-800 hover:bg-surface-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-5 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <i className="bi bi-check2"></i>
                  <span>Apply Crop</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
