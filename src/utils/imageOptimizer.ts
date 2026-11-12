export type ImageOutputFormat = 'image/webp' | 'image/jpeg';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OptimizeImageOptions {
  crop: CropRect;
  maxDimension?: number;
  targetMaxBytes?: number;
  format?: ImageOutputFormat;
  fileNameBase?: string;
}

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  format: ImageOutputFormat;
  extension: 'webp' | 'jpg';
  qualityUsed: number;
}

/**
 * Loads a File into a browser HTMLImageElement using an Object URL.
 */
export function loadImageElement(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode selected image file.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Renders an image rotated by 0, 90, 180, or 270 degrees into a clean offscreen canvas.
 */
export function buildRotatedCanvas(img: HTMLImageElement, rotationDeg: number): HTMLCanvasElement {
  const normalized = ((rotationDeg % 360) + 360) % 360;
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const swapAxes = normalized === 90 || normalized === 270;

  const canvas = document.createElement('canvas');
  canvas.width = swapAxes ? srcH : srcW;
  canvas.height = swapAxes ? srcW : srcH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable in this browser.');
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.restore();

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

function sanitizeFileBase(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
  return base || 'shrell-product-image';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

/**
 * Crops the rotated source canvas, resizes to e-commerce optimal bounds, and iteratively
 * compresses to WebP (default) or JPEG below targetMaxBytes to minimize CDN bandwidth & storage.
 */
export async function cropAndCompressImage(
  sourceCanvas: HTMLCanvasElement,
  originalBytes: number,
  options: OptimizeImageOptions
): Promise<OptimizedImageResult> {
  const maxDim = options.maxDimension ?? 1000;
  const targetMaxBytes = options.targetMaxBytes ?? 100 * 1024;
  const requestedFormat: ImageOutputFormat = options.format ?? 'image/webp';

  const safeCropX = Math.max(0, Math.min(sourceCanvas.width - 1, Math.round(options.crop.x)));
  const safeCropY = Math.max(0, Math.min(sourceCanvas.height - 1, Math.round(options.crop.y)));
  const safeCropW = Math.max(1, Math.min(sourceCanvas.width - safeCropX, Math.round(options.crop.width)));
  const safeCropH = Math.max(1, Math.min(sourceCanvas.height - safeCropY, Math.round(options.crop.height)));

  const longest = Math.max(safeCropW, safeCropH);
  const initialScale = longest > maxDim ? maxDim / longest : 1;

  let chosenFormat: ImageOutputFormat = requestedFormat;
  let bestBlob: Blob | null = null;
  let bestWidth = Math.max(1, Math.round(safeCropW * initialScale));
  let bestHeight = Math.max(1, Math.round(safeCropH * initialScale));
  let bestQuality = 0.86;

  // Try progressive dimension tiers only if quality reduction alone cannot hit targetMaxBytes
  const dimensionMultipliers = [1, 0.84, 0.7, 0.56];

  for (const mult of dimensionMultipliers) {
    const outW = Math.max(320, Math.round(safeCropW * initialScale * mult));
    const outH = Math.max(320, Math.round(safeCropH * initialScale * mult));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable for compression.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (requestedFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outW, outH);
    }

    ctx.drawImage(sourceCanvas, safeCropX, safeCropY, safeCropW, safeCropH, 0, 0, outW, outH);

    // Binary search quality between 0.45 and 0.90 to pick highest visual quality <= targetMaxBytes
    let low = 0.45;
    let high = 0.9;
    let underTargetBlob: Blob | null = null;
    let underTargetQ = low;
    let smallestBlobAtTier: Blob | null = null;
    let smallestQAtTier = low;

    // First verify chosen format works (browsers without WebP encode support return PNG/fallback)
    const probe = await canvasToBlob(outCanvas, requestedFormat, 0.85);
    const activeFormat: ImageOutputFormat =
      probe && probe.type === requestedFormat ? requestedFormat : 'image/jpeg';
    chosenFormat = activeFormat;

    if (probe && probe.type === activeFormat && probe.size <= targetMaxBytes) {
      bestBlob = probe;
      bestWidth = outW;
      bestHeight = outH;
      bestQuality = 0.85;
      break;
    }

    for (let step = 0; step < 6; step++) {
      const mid = Number(((low + high) / 2).toFixed(2));
      const blob = await canvasToBlob(outCanvas, activeFormat, mid);
      if (!blob) break;

      if (!smallestBlobAtTier || blob.size < smallestBlobAtTier.size) {
        smallestBlobAtTier = blob;
        smallestQAtTier = mid;
      }

      if (blob.size <= targetMaxBytes) {
        underTargetBlob = blob;
        underTargetQ = mid;
        low = mid + 0.02;
      } else {
        high = mid - 0.02;
      }
      if (low > high) break;
    }

    if (underTargetBlob) {
      bestBlob = underTargetBlob;
      bestWidth = outW;
      bestHeight = outH;
      bestQuality = underTargetQ;
      break;
    }

    bestBlob = smallestBlobAtTier;
    bestWidth = outW;
    bestHeight = outH;
    bestQuality = smallestQAtTier;
  }

  if (!bestBlob) {
    throw new Error('Failed to generate compressed image output.');
  }

  const extension: 'webp' | 'jpg' = chosenFormat === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${sanitizeFileBase(options.fileNameBase || 'product')}.${extension}`;
  const compressedFile = new File([bestBlob], fileName, {
    type: chosenFormat,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(compressedFile);

  return {
    file: compressedFile,
    previewUrl,
    width: bestWidth,
    height: bestHeight,
    originalBytes,
    compressedBytes: compressedFile.size,
    format: chosenFormat,
    extension,
    qualityUsed: bestQuality,
  };
}
