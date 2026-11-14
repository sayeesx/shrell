import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Category, HeroBanner, Product } from '../../domain/types';
import {
  bannerRepository,
  categoryRepository,
  productRepository,
} from '../../infrastructure/repositories';
import { cloudinaryService } from '../../infrastructure/cloudinary/cloudinaryService';
import { cropAndCompressImage, formatBytes, optimizeImageFile } from '../../utils/imageOptimizer';
import { useBodyScrollLock } from '../../components/common/useBodyScrollLock';
import { SquareGridLoader } from '../../components/common/SquareGridLoader';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';

interface CropModalState {
  isOpen: boolean;
  target: 'desktop' | 'mobile';
  imageUrl: string;
  originalFile: File | null;
}

export const AdminBanners: React.FC = () => {
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string>('');
  const [linkType, setLinkType] = useState<'page' | 'product'>('page');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('/catalogue');
  const [altText, setAltText] = useState<string>('');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [uploading, setUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Helper to safely compress uploaded images into lightweight data URLs when Cloudinary is unavailable
  const fileToCompressedDataUrl = async (file: File | Blob, maxWidth = 1600): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Crop Modal States
  const [cropModal, setCropModal] = useState<CropModalState>({
    isOpen: false,
    target: 'desktop',
    imageUrl: '',
    originalFile: null,
  });

  useBodyScrollLock(cropModal.isOpen || isAdding);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 5); // default desktop ~3.2:1
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const [bannerList, productRes, categoryList] = await Promise.all([
        bannerRepository.getAllForAdmin(),
        productRepository.getAll({ limit: 100 }),
        categoryRepository.getAll(),
      ]);
      setBanners(bannerList);
      setProducts(productRes.products);
      setCategories(categoryList);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
      finishPageLoad();
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

  const handleApplyCrop = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDesktop = cropModal.target === 'desktop';
    try {
      const optimized = await cropAndCompressImage(
        canvas,
        cropModal.originalFile?.size || canvas.width * canvas.height,
        {
          crop: { x: 0, y: 0, width: canvas.width, height: canvas.height },
          maxDimension: isDesktop ? 1440 : 900,
          targetMaxBytes: (isDesktop ? 150 : 95) * 1024,
          format: 'image/webp',
          fileNameBase: `${cropModal.target}-banner`,
        }
      );

      if (isDesktop) {
        setDesktopFile(optimized.file);
        setDesktopPreview(optimized.previewUrl);
      } else {
        setMobileFile(optimized.file);
        setMobilePreview(optimized.previewUrl);
      }

      setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null });
      setStatusMessage({
        text: `Cropped & compressed ${cropModal.target} banner to WebP (${formatBytes(optimized.compressedBytes)}).`,
        isError: false,
      });
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || `Failed to optimize ${cropModal.target} banner crop.`,
        isError: true,
      });
    }
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

      // 1. Optimize & upload Desktop image via Cloudinary service, with safe local fallback
      if (desktopFile) {
        let readyDesktop = desktopFile;
        if (readyDesktop.type !== 'image/svg+xml' && (readyDesktop.type !== 'image/webp' || readyDesktop.size > 160 * 1024)) {
          const opt = await optimizeImageFile(readyDesktop, {
            maxDimension: 1440,
            targetMaxBytes: 150 * 1024,
            format: 'image/webp',
            fileNameBase: 'shrell-desktop-banner',
          });
          URL.revokeObjectURL(opt.previewUrl);
          readyDesktop = opt.file;
        }
        try {
          const result = await cloudinaryService.uploadImage(readyDesktop, {
            assetFolder: 'shrell/banners',
            tags: 'banner,desktop',
          });
          uploadedDesktopUrl = result.url;
        } catch (cloudErr) {
          console.warn('Cloudinary upload error, using optimized local storage:', cloudErr);
          uploadedDesktopUrl = await fileToCompressedDataUrl(readyDesktop, 1400);
        }
      }

      // 2. Optimize & upload Mobile image if provided
      if (mobileFile) {
        let readyMobile = mobileFile;
        if (readyMobile.type !== 'image/svg+xml' && (readyMobile.type !== 'image/webp' || readyMobile.size > 105 * 1024)) {
          const opt = await optimizeImageFile(readyMobile, {
            maxDimension: 900,
            targetMaxBytes: 95 * 1024,
            format: 'image/webp',
            fileNameBase: 'shrell-mobile-banner',
          });
          URL.revokeObjectURL(opt.previewUrl);
          readyMobile = opt.file;
        }
        try {
          const result = await cloudinaryService.uploadImage(readyMobile, {
            assetFolder: 'shrell/banners',
            tags: 'banner,mobile',
          });
          uploadedMobileUrl = result.url;
        } catch (cloudErr) {
          console.warn('Cloudinary upload error, using optimized local storage:', cloudErr);
          uploadedMobileUrl = await fileToCompressedDataUrl(readyMobile, 800);
        }
      }

      // 3. Ensure no temporary blob: URLs are persisted to repository
      if (uploadedDesktopUrl && uploadedDesktopUrl.startsWith('blob:')) {
        try {
          const res = await fetch(uploadedDesktopUrl);
          const blob = await res.blob();
          uploadedDesktopUrl = await fileToCompressedDataUrl(blob, 1400);
        } catch (e) {
          console.warn('Failed to convert desktop blob to persistent data url:', e);
        }
      }
      if (uploadedMobileUrl && uploadedMobileUrl.startsWith('blob:')) {
        try {
          const res = await fetch(uploadedMobileUrl);
          const blob = await res.blob();
          uploadedMobileUrl = await fileToCompressedDataUrl(blob, 800);
        } catch (e) {
          console.warn('Failed to convert mobile blob to persistent data url:', e);
        }
      }

      const finalDesktopUrl = uploadedDesktopUrl?.startsWith('http://')
        ? uploadedDesktopUrl.replace(/^http:\/\//, 'https://')
        : uploadedDesktopUrl;
      const finalMobileUrl = (uploadedMobileUrl || uploadedDesktopUrl)?.startsWith('http://')
        ? (uploadedMobileUrl || uploadedDesktopUrl).replace(/^http:\/\//, 'https://')
        : (uploadedMobileUrl || uploadedDesktopUrl);

      // 3. Save to repository (persists to Sanity CMS when configured, with local fallback)
      await bannerRepository.create({
        desktopImageUrl: finalDesktopUrl,
        mobileImageUrl: finalMobileUrl,
        desktopImageFile: desktopFile || undefined,
        mobileImageFile: mobileFile || undefined,
        targetUrl: targetUrl.trim() || '/catalogue',
        altText: altText.trim() || 'Hero Banner',
        order: Number(order) || (banners.length + 1),
        isActive: true,
      });

      setStatusMessage({ text: 'Hero banner published successfully!', isError: false });
      setIsAdding(false);
      // Reset form
      setDesktopFile(null);
      setDesktopPreview('');
      setMobileFile(null);
      setMobilePreview('');
      setLinkType('page');
      setSelectedProductSlug('');
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
    const nextState = !banner.isActive;
    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, isActive: nextState } : b))
    );
    try {
      await bannerRepository.update(banner.id, { isActive: nextState });
      setStatusMessage({
        text: `Slide #${banner.order} marked as ${nextState ? 'Active' : 'Hidden'}!`,
        isError: false,
      });
    } catch (err: any) {
      console.error('Failed to update banner:', err);
      // Revert optimistic update
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !nextState } : b))
      );
      setStatusMessage({ text: err.message || 'Failed to update banner', isError: true });
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      // Optimistic UI update
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setConfirmDeleteId(null);
      await bannerRepository.delete(id);
      setStatusMessage({ text: 'Hero banner deleted successfully!', isError: false });
    } catch (err: any) {
      console.error('Failed to delete banner:', err);
      await loadBanners();
      setStatusMessage({ text: err.message || 'Failed to delete banner', isError: true });
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-[#222222]' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Hero Carousel Banners
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Upload custom cropped banners for desktop &amp; mobile with page or product navigation links.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setStatusMessage(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer ${
            isDark
              ? 'bg-slate-100 hover:bg-white text-slate-950'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <i className={`bi ${isAdding ? 'bi-x-lg' : 'bi-plus-lg'} text-sm`}></i>
          <span>{isAdding ? 'Close Uploader' : 'Add New Banner'}</span>
        </button>
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium border ${
            statusMessage.isError
              ? isDark
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
              : isDark
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Add New Banner Modal (3/4 window adaptive size) */}
      {isAdding && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div
            className="fixed inset-0 modal-backdrop-solid"
            onClick={() => {
              if (!uploading) setIsAdding(false);
            }}
            aria-hidden="true"
          />
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateBanner}
            className={`relative z-10 admin-modal-panel border rounded-xl shadow-2xl overflow-hidden my-auto ${
              isDark ? 'admin-modal-dark bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isDark ? 'border-[#222222]' : 'border-slate-200'}`}>
              <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Upload &amp; Custom Crop Hero Banner
              </h2>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setIsAdding(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                aria-label="Close banner uploader"
              >
                <i className="bi bi-x-lg text-xs" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Banner Upload Dimensions Specifications */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 text-xs font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <i className="bi bi-display text-sm"></i>
                <span>Desktop Banner Size Specs</span>
              </div>
              <ul className={`text-[11px] space-y-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li>• <strong>Recommended:</strong> 1920 × 600 px (or 1600 × 500 px)</li>
                <li>• <strong>Aspect Ratio:</strong> 16:5 (~3.2:1)</li>
                <li>• <strong>Storefront Display:</strong> Max height 320px</li>
              </ul>
            </div>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 text-xs font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <i className="bi bi-phone text-sm"></i>
                <span>Mobile Banner Size Specs</span>
              </div>
              <ul className={`text-[11px] space-y-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li>• <strong>Recommended:</strong> 800 × 450 px (or 750 × 420 px)</li>
                <li>• <strong>Aspect Ratio:</strong> 16:9 (~1.78:1)</li>
                <li>• <strong>Storefront Display:</strong> Max height 180px</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Banner Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  1. Desktop Banner Image *
                </label>
                {desktopPreview && (
                  <button
                    type="button"
                    onClick={() => openCropper('desktop')}
                    className={`text-[11px] font-semibold flex items-center gap-1 hover:underline ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    <i className="bi bi-crop"></i>
                    <span>Crop for Desktop</span>
                  </button>
                )}
              </div>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDark ? 'border-slate-700 hover:border-slate-500 bg-slate-950' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}>
                {desktopPreview ? (
                  <div className="space-y-2.5">
                    <img
                      src={desktopPreview}
                      alt="Desktop Preview"
                      className="max-h-36 mx-auto object-contain rounded-md"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <label className={`text-xs hover:underline cursor-pointer font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                        }`}
                      >
                        <i className="bi bi-crop"></i>
                        <span>Crop Banner</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-2">
                    <i className={`bi bi-display text-2xl ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                    <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Click to select Desktop Banner</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PNG / WebP with transparency supported</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDesktopFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {/* Direct URL Input Fallback */}
              <div className="pt-1">
                <label className={`block text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Or Paste Direct Cloudinary / Image URL:
                </label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  value={desktopPreview.startsWith('http') ? desktopPreview : ''}
                  onChange={(e) => {
                    setDesktopPreview(e.target.value);
                    setDesktopFile(null);
                  }}
                  className={`w-full px-3 py-1.5 border rounded-md text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Mobile Banner Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  2. Mobile Banner Image (Optional)
                </label>
                {mobilePreview && (
                  <button
                    type="button"
                    onClick={() => openCropper('mobile')}
                    className={`text-[11px] font-semibold flex items-center gap-1 hover:underline ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    <i className="bi bi-crop"></i>
                    <span>Crop for Mobile</span>
                  </button>
                )}
              </div>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDark ? 'border-slate-700 hover:border-slate-500 bg-slate-950' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}>
                {mobilePreview ? (
                  <div className="space-y-2.5">
                    <img
                      src={mobilePreview}
                      alt="Mobile Preview"
                      className="max-h-36 mx-auto object-contain rounded-md"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <label className={`text-xs hover:underline cursor-pointer font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                        }`}
                      >
                        <i className="bi bi-crop"></i>
                        <span>Crop Banner</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-2">
                    <i className={`bi bi-phone text-2xl ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                    <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Click to select Mobile Banner</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Falls back to desktop banner if not provided</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMobileFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {/* Direct Mobile URL Input */}
              <div className="pt-1">
                <label className={`block text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Or Paste Direct Mobile Cloudinary / Image URL:
                </label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  value={mobilePreview.startsWith('http') ? mobilePreview : ''}
                  onChange={(e) => {
                    setMobilePreview(e.target.value);
                    setMobileFile(null);
                  }}
                  className={`w-full px-3 py-1.5 border rounded-md text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Navigation Link & Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Banner Click Destination *
                </label>
                <div className="inline-flex rounded-lg border overflow-hidden text-[11px] font-mono border-slate-700/40">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('page');
                      if (targetUrl.startsWith('/product/')) {
                        setTargetUrl('/catalogue');
                      }
                    }}
                    className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                      linkType === 'page'
                        ? 'bg-[#FF000E] text-white'
                        : isDark
                          ? 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Store Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('product');
                      const fallbackProd =
                        products.find((p) => p.slug === selectedProductSlug) || products[0];
                      if (fallbackProd) {
                        setSelectedProductSlug(fallbackProd.slug);
                        setTargetUrl(`/product/${fallbackProd.slug}`);
                        if (!altText.trim()) setAltText(fallbackProd.name);
                      }
                    }}
                    className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                      linkType === 'product'
                        ? 'bg-[#FF000E] text-white'
                        : isDark
                          ? 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Uploaded Product ({products.length})
                  </button>
                </div>
              </div>

              {linkType === 'product' ? (
                <div className="space-y-1.5">
                  <select
                    id="banner-product-select"
                    aria-label="Select uploaded product for banner"
                    value={selectedProductSlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setSelectedProductSlug(slug);
                      if (slug) {
                        setTargetUrl(`/product/${slug}`);
                        const chosen = products.find((p) => p.slug === slug);
                        if (chosen && !altText.trim()) {
                          setAltText(chosen.name);
                        }
                      }
                    }}
                    className={`w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  >
                    {products.length === 0 ? (
                      <option value="">No uploaded products available</option>
                    ) : (
                      products.map((prod) => (
                        <option key={prod.id} value={prod.slug}>
                          {prod.name} ({prod.sku})
                        </option>
                      ))
                    )}
                  </select>
                  <p className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Navigates to product details: <span className="font-semibold">{targetUrl}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    id="banner-page-select"
                    aria-label="Select storefront page for banner"
                    value={
                      [
                        '/',
                        '/catalogue',
                        '/pre-book',
                        '/cart',
                        '/track',
                        '/profile',
                        ...categories.map((c) => `/catalogue?category=${c.slug}`),
                      ].includes(targetUrl)
                        ? targetUrl
                        : 'custom'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'custom') {
                        setTargetUrl(val);
                      }
                    }}
                    className={`w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  >
                    <option value="/catalogue">Equipment Catalogue (/catalogue)</option>
                    <option value="/">Home Page (/)</option>
                    <option value="/pre-book">Ultra Shampoo Pre-Book (/pre-book)</option>
                    <option value="/cart">My Cart (/cart)</option>
                    <option value="/track">Track Order (/track)</option>
                    {categories
                      .filter((c) => c.isActive)
                      .map((cat) => (
                        <option key={cat.id} value={`/catalogue?category=${cat.slug}`}>
                          Category: {cat.name} (/catalogue?category={cat.slug})
                        </option>
                      ))}
                    <option value="custom">Custom Page URL...</option>
                  </select>

                  <input
                    id="banner-target-url"
                    type="text"
                    required
                    aria-label="Target Page Navigation URL"
                    placeholder="e.g. /catalogue or /catalogue?category=roof-racks-cargo"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className={`w-full border rounded-lg px-3.5 py-2 text-xs font-mono focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="banner-order" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Carousel Order (1, 2, 3...)
              </label>
              <input
                id="banner-order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className={`w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="banner-alt" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Alt Text / Title (Accessibility)
              </label>
              <input
                id="banner-alt"
                type="text"
                placeholder="e.g. Festival Season Car Care Deals"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className={`w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                }`}
              />
            </div>

            <div className="flex items-center pt-5">
              <label className={`flex items-center gap-2 text-xs cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-400 text-slate-900 w-4 h-4"
                />
                <span>Active on Storefront</span>
              </label>
            </div>
          </div>

            </div>
          {/* Submit Actions */}
          <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t shrink-0 ${isDark ? 'border-[#222222] bg-[#050505]' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-4 py-2 text-xs transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className={`px-6 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-100 hover:bg-white text-slate-950 disabled:opacity-50'
                  : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50'
              }`}
            >
              {uploading ? (
                <>
                  <SquareGridLoader size={14} white />
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
        </div>,
        document.body
      )}

      {/* Banners List */}
      <div className="space-y-3">
        <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Current Carousel Slides ({banners.length})
        </h2>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <SquareGridLoader size={48} color="#FF000E" />
          </div>
        ) : banners.length === 0 ? (
          <div className={`p-8 rounded-xl border text-center text-xs ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
            No banners created yet. Click &quot;Add New Banner&quot; above to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Thumbnails */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-40 h-20 rounded-lg border overflow-hidden flex-shrink-0 flex items-center justify-center ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <img
                      src={b.desktopImageUrl}
                      alt={b.altText || 'Desktop Banner'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {b.mobileImageUrl && b.mobileImageUrl !== b.desktopImageUrl && (
                    <div className={`w-16 h-20 rounded-lg border overflow-hidden flex-shrink-0 hidden sm:flex items-center justify-center ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <img
                        src={b.mobileImageUrl}
                        alt="Mobile Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Slide #{b.order}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold ${
                          b.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : isDark
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {b.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    <div className={`text-xs font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Target Link: <span className="underline">{b.targetUrl}</span>
                    </div>

                    {b.altText && (
                      <div className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Title: {b.altText}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                      b.isActive
                        ? isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent font-medium'
                    }`}
                  >
                    {b.isActive ? 'Hide' : 'Unhide'}
                  </button>

                  {confirmDeleteId === b.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wide transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(b.id)}
                      className={`p-1.5 rounded-lg border transition-colors text-slate-400 hover:text-rose-500 ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                      }`}
                      title="Delete banner"
                    >
                      <i className="bi bi-trash3 text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* INTERACTIVE CROPPER MODAL (Desktop & Mobile Custom Ratio & Preview) */}
      {/* =================================================================== */}
      {cropModal.isOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
        >
          {/* Dedicated Fullscreen Frosted Backdrop Layer (zero background bleed) */}
          <div
            className="fixed inset-0 modal-backdrop-solid"
            onClick={() => setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null })}
            aria-hidden="true"
          />

          {/* Centered Modal Card (3/4 window adaptive size) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 admin-modal-panel border rounded-xl p-5 sm:p-6 space-y-4 overflow-y-auto shadow-2xl my-auto ${isDark ? 'admin-modal-dark bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <i className={`bi bi-crop text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}></i>
                <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Crop Banner for {cropModal.target === 'desktop' ? 'Desktop' : 'Mobile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null })}
                className={`p-1 rounded-md transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* Aspect Ratio Presets */}
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aspect Ratio Preset</label>
              <div className="flex flex-wrap gap-2">
                {cropModal.target === 'desktop' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(16 / 5)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(aspectRatio - 16 / 5) < 0.05
                          ? isDark
                            ? 'bg-slate-100 text-slate-900 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      16:5 (Ultrawide Banner)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(16 / 9)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(aspectRatio - 16 / 9) < 0.05
                          ? isDark
                            ? 'bg-slate-100 text-slate-900 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      16:9 (Standard Widescreen)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(21 / 9)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(aspectRatio - 21 / 9) < 0.05
                          ? isDark
                            ? 'bg-slate-100 text-slate-900 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
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
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(aspectRatio - 16 / 9) < 0.05
                          ? isDark
                            ? 'bg-slate-100 text-slate-900 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      16:9 (Mobile Banner)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(4 / 3)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(aspectRatio - 4 / 3) < 0.05
                          ? isDark
                            ? 'bg-slate-100 text-slate-900 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      4:3 (Taller Card)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio(1)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        Math.abs(aspectRatio - 1) < 0.05
                          ? isDark
                            ? 'bg-slate-100 text-slate-900 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      1:1 (Square)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Canvas Preview Area */}
            <div className={`p-3 rounded-lg border flex items-center justify-center overflow-hidden ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-[300px] object-contain rounded border ${
                  isDark ? 'border-slate-800' : 'border-slate-300'
                }`}
              />
            </div>

            {/* Adjustments: Zoom & Pan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Zoom</span>
                  <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-slate-600 dark:accent-slate-300 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Pan X</span>
                  <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{panX}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={panX}
                  onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-600 dark:accent-slate-300 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Pan Y</span>
                  <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{panY}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={panY}
                  onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-600 dark:accent-slate-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPanX(0);
                  setPanY(0);
                }}
                className={`text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Reset Crop</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropModal({ isOpen: false, target: 'desktop', imageUrl: '', originalFile: null })}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-slate-100 hover:bg-white text-slate-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <i className="bi bi-check2"></i>
                  <span>Apply Crop</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
