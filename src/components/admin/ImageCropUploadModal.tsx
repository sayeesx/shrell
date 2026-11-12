import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../application/ThemeContext';
import { useBodyScrollLock } from '../common/useBodyScrollLock';
import {
  buildRotatedCanvas,
  cropAndCompressImage,
  CropRect,
  formatBytes,
  ImageOutputFormat,
  loadImageElement,
  OptimizedImageResult,
} from '../../utils/imageOptimizer';

type AspectPreset = '1:1' | '4:3' | 'original';

export interface ImageCropUploadModalProps {
  file: File | null;
  isOpen: boolean;
  slotLabel?: string;
  suggestedName?: string;
  isUploading?: boolean;
  onCancel: () => void;
  onConfirm: (optimizedFile: File, result: OptimizedImageResult) => Promise<void> | void;
}

const WORKSPACE_MAX_W = 340;
const WORKSPACE_MAX_H = 270;

export const ImageCropUploadModal: React.FC<ImageCropUploadModalProps> = ({
  file,
  isOpen,
  slotLabel = 'Product Image',
  suggestedName,
  isUploading = false,
  onCancel,
  onConfirm,
}) => {
  const { isDark } = useTheme();
  useBodyScrollLock(isOpen);

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('1:1');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [format, setFormat] = useState<ImageOutputFormat>('image/webp');
  const [targetMaxKb, setTargetMaxKb] = useState<number>(100);
  const [loadError, setLoadError] = useState<string>('');

  const [estimate, setEstimate] = useState<OptimizedImageResult | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  }>({ active: false, startX: 0, startY: 0, origPanX: 0, origPanY: 0 });

  const latestPreviewUrlRef = useRef<string | null>(null);

  // Load selected File into HTMLImageElement
  useEffect(() => {
    if (!isOpen || !file) {
      setSourceImg(null);
      return;
    }

    let cancelled = false;
    let loadedUrl = '';
    setLoadError('');
    setRotationDeg(0);
    setAspectPreset('1:1');
    setZoom(1);
    setPan({ x: 0, y: 0 });

    loadImageElement(file)
      .then(({ img, objectUrl }) => {
        loadedUrl = objectUrl;
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setSourceImg(img);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message || 'Unable to read image.');
        }
      });

    return () => {
      cancelled = true;
      if (loadedUrl) URL.revokeObjectURL(loadedUrl);
    };
  }, [isOpen, file]);

  // Close on Escape key unless upload is in progress
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isUploading, isSubmitting, onCancel]);

  // Cleanup estimate object URLs
  useEffect(() => {
    return () => {
      if (latestPreviewUrlRef.current) {
        URL.revokeObjectURL(latestPreviewUrlRef.current);
        latestPreviewUrlRef.current = null;
      }
    };
  }, []);

  // Build normalized rotated offscreen canvas + dataURL preview for smooth positioning
  const rotatedData = useMemo(() => {
    if (!sourceImg) return null;
    const canvas = buildRotatedCanvas(sourceImg, rotationDeg);
    return {
      canvas,
      width: canvas.width,
      height: canvas.height,
      previewSrc: canvas.toDataURL('image/png'),
    };
  }, [sourceImg, rotationDeg]);

  // Compute crop viewport dimensions matching chosen aspect ratio inside workspace bounds
  const cropBox = useMemo(() => {
    const nativeRatio = rotatedData ? rotatedData.width / rotatedData.height : 1;
    const targetRatio =
      aspectPreset === '1:1' ? 1 : aspectPreset === '4:3' ? 4 / 3 : Math.max(0.4, Math.min(2.4, nativeRatio));

    let width = WORKSPACE_MAX_W;
    let height = width / targetRatio;
    if (height > WORKSPACE_MAX_H) {
      height = WORKSPACE_MAX_H;
      width = height * targetRatio;
    }
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }, [aspectPreset, rotatedData]);

  // Base scale covers the crop viewport cleanly; zoom multiplies on top
  const scaleMetrics = useMemo(() => {
    if (!rotatedData) {
      return { baseScale: 1, effectiveScale: 1, maxPanX: 0, maxPanY: 0, drawW: 0, drawH: 0 };
    }
    const baseScale = Math.max(cropBox.width / rotatedData.width, cropBox.height / rotatedData.height);
    const effectiveScale = baseScale * zoom;
    const drawW = rotatedData.width * effectiveScale;
    const drawH = rotatedData.height * effectiveScale;
    const maxPanX = Math.max(0, (drawW - cropBox.width) / 2);
    const maxPanY = Math.max(0, (drawH - cropBox.height) / 2);
    return { baseScale, effectiveScale, maxPanX, maxPanY, drawW, drawH };
  }, [rotatedData, cropBox, zoom]);

  const clampPan = useCallback(
    (x: number, y: number) => ({
      x: Math.max(-scaleMetrics.maxPanX, Math.min(scaleMetrics.maxPanX, x)),
      y: Math.max(-scaleMetrics.maxPanY, Math.min(scaleMetrics.maxPanY, y)),
    }),
    [scaleMetrics.maxPanX, scaleMetrics.maxPanY]
  );

  // Re-clamp pan if zoom or aspect shrinks bounds
  useEffect(() => {
    setPan((prev) => {
      const next = clampPan(prev.x, prev.y);
      return next.x === prev.x && next.y === prev.y ? prev : next;
    });
  }, [clampPan]);

  const computeCurrentCropRect = useCallback((): CropRect | null => {
    if (!rotatedData || scaleMetrics.effectiveScale <= 0) return null;
    const drawX = (cropBox.width - scaleMetrics.drawW) / 2 + pan.x;
    const drawY = (cropBox.height - scaleMetrics.drawH) / 2 + pan.y;
    return {
      x: Math.max(0, -drawX / scaleMetrics.effectiveScale),
      y: Math.max(0, -drawY / scaleMetrics.effectiveScale),
      width: cropBox.width / scaleMetrics.effectiveScale,
      height: cropBox.height / scaleMetrics.effectiveScale,
    };
  }, [rotatedData, cropBox, scaleMetrics, pan]);

  // Run debounced optimization preview so user sees exact KB & output dimensions before uploading
  useEffect(() => {
    if (!isOpen || !file || !rotatedData) return;
    const crop = computeCurrentCropRect();
    if (!crop) return;

    let cancelled = false;
    setIsEstimating(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await cropAndCompressImage(rotatedData.canvas, file.size, {
          crop,
          maxDimension: 1000,
          targetMaxBytes: targetMaxKb * 1024,
          format,
          fileNameBase: suggestedName || file.name,
        });
        if (cancelled) {
          URL.revokeObjectURL(res.previewUrl);
          return;
        }
        if (latestPreviewUrlRef.current) {
          URL.revokeObjectURL(latestPreviewUrlRef.current);
        }
        latestPreviewUrlRef.current = res.previewUrl;
        setEstimate(res);
      } catch (err) {
        console.error('Compression preview failed:', err);
      } finally {
        if (!cancelled) setIsEstimating(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, file, rotatedData, computeCurrentCropRect, format, targetMaxKb, suggestedName]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan(clampPan(dragRef.current.origPanX + dx, dragRef.current.origPanY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }
  };

  const handleConfirm = async () => {
    if (!file || !rotatedData || isSubmitting || isUploading) return;
    const crop = computeCurrentCropRect();
    if (!crop) return;

    setIsSubmitting(true);
    try {
      const optimized = await cropAndCompressImage(rotatedData.canvas, file.size, {
        crop,
        maxDimension: 1000,
        targetMaxBytes: targetMaxKb * 1024,
        format,
        fileNameBase: suggestedName || file.name,
      });
      await onConfirm(optimized.file, optimized);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !file) return null;

  const busy = isSubmitting || isUploading;
  const savedPct =
    estimate && file.size > 0
      ? Math.max(0, Math.round((1 - estimate.compressedBytes / file.size) * 100))
      : 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
    >
      <div
        className="fixed inset-0 modal-backdrop-solid"
        onClick={() => {
          if (!busy) onCancel();
        }}
        aria-hidden="true"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-xl border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto ${
          isDark ? 'bg-[#120D0F] border-[#2C181C] text-[#F1EEEE]' : 'bg-white border-[#E0DBD2] text-[#140E10]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-[#261619] bg-[#160F11]' : 'border-[#E0DBD2] bg-[#FAF8F4]'
          }`}
        >
          <div className="min-w-0">
            <h2 id="crop-modal-title" className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider truncate">
              Crop &amp; Optimize {slotLabel}
            </h2>
            <p className={`text-[11px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Source: {file.name} ({formatBytes(file.size)})
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            aria-label="Cancel image crop"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-[#5C5456] hover:text-[#140E10] hover:bg-black/5'
            }`}
          >
            <i className="bi bi-x-lg text-xs" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {loadError ? (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 font-mono text-xs">
              {loadError}
            </div>
          ) : (
            <>
              {/* Aspect Ratio & Transform Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: '1:1', label: '1:1 Square' },
                      { id: '4:3', label: '4:3 Gallery' },
                      { id: 'original', label: 'Original' },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAspectPreset(preset.id);
                        setPan({ x: 0, y: 0 });
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                        aspectPreset === preset.id
                          ? 'bg-[#FF000E] border-[#FF000E] text-white'
                          : isDark
                            ? 'bg-[#191214] border-[#2E1E22] text-slate-300 hover:border-slate-500'
                            : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#3A3030] hover:border-[#140E10]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRotationDeg((r) => (r + 90) % 360);
                      setPan({ x: 0, y: 0 });
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border flex items-center gap-1 cursor-pointer ${
                      isDark
                        ? 'bg-[#191214] border-[#2E1E22] text-slate-300 hover:text-white'
                        : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#3A3030] hover:text-[#140E10]'
                    }`}
                  >
                    <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                      setRotationDeg(0);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border cursor-pointer ${
                      isDark
                        ? 'bg-[#191214] border-[#2E1E22] text-slate-300 hover:text-white'
                        : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#3A3030] hover:text-[#140E10]'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Interactive Crop Box */}
              <div
                className={`rounded-xl p-4 flex flex-col items-center justify-center border ${
                  isDark ? 'bg-[#090607] border-[#261619]' : 'bg-[#171214] border-[#2E2528]'
                }`}
              >
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    width: `${cropBox.width}px`,
                    height: `${cropBox.height}px`,
                    touchAction: 'none',
                    backgroundImage:
                      'linear-gradient(45deg, #1b1719 25%, transparent 25%), linear-gradient(-45deg, #1b1719 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1b1719 75%), linear-gradient(-45deg, transparent 75%, #1b1719 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  }}
                  className="relative overflow-hidden rounded-lg border-2 border-[#FF000E] cursor-grab active:cursor-grabbing select-none shadow-lg"
                >
                  {rotatedData && (
                    <img
                      src={rotatedData.previewSrc}
                      alt="Crop preview"
                      draggable={false}
                      style={{
                        position: 'absolute',
                        left: `${(cropBox.width - scaleMetrics.drawW) / 2 + pan.x}px`,
                        top: `${(cropBox.height - scaleMetrics.drawH) / 2 + pan.y}px`,
                        width: `${scaleMetrics.drawW}px`,
                        height: `${scaleMetrics.drawH}px`,
                        maxWidth: 'none',
                        userSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Rule-of-thirds overlay grid */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/15" />
                    ))}
                  </div>
                </div>

                {/* Zoom Slider */}
                <div className="w-full max-w-[340px] mt-3 flex items-center gap-3 text-slate-300 font-mono text-[11px]">
                  <i className="bi bi-zoom-out" aria-hidden="true" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    aria-label="Crop zoom"
                    className="flex-1 accent-[#FF000E] cursor-pointer"
                  />
                  <i className="bi bi-zoom-in" aria-hidden="true" />
                  <span className="w-10 text-right tabular-nums">{zoom.toFixed(2)}x</span>
                </div>
              </div>

              {/* Format & Target Compression Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-xl border space-y-2 ${
                    isDark ? 'border-[#261619] bg-[#160F11]' : 'border-[#E0DBD2] bg-[#FAF8F4]'
                  }`}
                >
                  <div className="font-mono font-bold uppercase text-[10px] tracking-wider text-[#FF000E]">
                    Output Format
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormat('image/webp')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                        format === 'image/webp'
                          ? 'bg-[#FF000E] border-[#FF000E] text-white'
                          : isDark
                            ? 'bg-[#0F0B0C] border-[#2C181C] text-slate-300'
                            : 'bg-white border-[#E0DBD2] text-[#3A3030]'
                      }`}
                    >
                      .WEBP (Best)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('image/jpeg')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                        format === 'image/jpeg'
                          ? 'bg-[#FF000E] border-[#FF000E] text-white'
                          : isDark
                            ? 'bg-[#0F0B0C] border-[#2C181C] text-slate-300'
                            : 'bg-white border-[#E0DBD2] text-[#3A3030]'
                      }`}
                    >
                      .JPEG
                    </button>
                  </div>
                  <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                    WebP reduces image payload ~30% over JPEG and preserves transparent cutouts to stretch Cloudinary free credits.
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-2 ${
                    isDark ? 'border-[#261619] bg-[#160F11]' : 'border-[#E0DBD2] bg-[#FAF8F4]'
                  }`}
                >
                  <div className="font-mono font-bold uppercase text-[10px] tracking-wider text-[#FF000E]">
                    Max File Weight Cap
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { kb: 80, label: '80 KB' },
                      { kb: 100, label: '100 KB' },
                      { kb: 150, label: '150 KB' },
                    ].map((opt) => (
                      <button
                        key={opt.kb}
                        type="button"
                        onClick={() => setTargetMaxKb(opt.kb)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                          targetMaxKb === opt.kb
                            ? 'bg-[#FF000E] border-[#FF000E] text-white'
                            : isDark
                              ? 'bg-[#0F0B0C] border-[#2C181C] text-slate-300'
                              : 'bg-white border-[#E0DBD2] text-[#3A3030]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                    100 KB max delivers instant mobile page loads and lowers CDN bandwidth usage.
                  </p>
                </div>
              </div>

              {/* Compression Output Readout */}
              <div
                className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] ${
                  isDark ? 'border-emerald-900/50 bg-emerald-950/25 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {isEstimating && !estimate ? (
                  <span>Calculating optimized WebP output...</span>
                ) : estimate ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold uppercase">{estimate.extension.toUpperCase()}</span>
                      <span>•</span>
                      <span>
                        {estimate.width} x {estimate.height} px
                      </span>
                      <span>•</span>
                      <span>
                        {formatBytes(file.size)} -&gt; <strong>{formatBytes(estimate.compressedBytes)}</strong>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                      {savedPct > 0 ? `-${savedPct}% saved` : 'Optimized'}
                    </span>
                  </>
                ) : (
                  <span>Drag to frame product, then confirm upload.</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-end gap-3 ${
            isDark ? 'border-[#261619] bg-[#160F11]' : 'border-[#E0DBD2] bg-[#FAF8F4]'
          }`}
        >
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
              isDark
                ? 'border-[#2E1E22] text-slate-300 hover:bg-white/5'
                : 'border-[#E0DBD2] text-[#3A3030] hover:bg-black/5'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || Boolean(loadError) || !rotatedData}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] disabled:opacity-50 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
          >
            {busy ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading to CDN...</span>
              </>
            ) : (
              <>
                <i className="bi bi-crop" aria-hidden="true" />
                <span>Crop, Optimize &amp; Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
