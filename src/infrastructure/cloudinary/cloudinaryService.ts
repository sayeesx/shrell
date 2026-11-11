/**
 * Cloudinary Upload Service
 * Handles uploading desktop and mobile banner images directly to Cloudinary.
 * Preserves transparency (no background removal, no lossy compression).
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
}

export interface CloudinaryUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/gif',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    this.cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
    this.uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
  }

  public isConfigured(): boolean {
    return Boolean(
      this.cloudName &&
      this.uploadPreset &&
      this.cloudName !== 'your_cloud_name' &&
      this.uploadPreset !== 'your_upload_preset' &&
      !this.cloudName.includes('placeholder')
    );
  }

  /**
   * Upload an image file with strict validation and HTTPS enforcement.
   */
  public async uploadImage(
    file: File,
    options?: CloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> {
    const allowedTypes = options?.allowedTypes || DEFAULT_ALLOWED_TYPES;
    const maxSizeBytes = options?.maxSizeBytes || DEFAULT_MAX_SIZE;

    // Validate mime type
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(
        `Unsupported image format: ${file.type}. Allowed formats: JPEG, PNG, WebP, SVG, AVIF, GIF.`
      );
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      const actualMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`File size (${actualMb} MB) exceeds maximum allowed size of ${maxMb} MB.`);
    }

    // If Cloudinary is configured with real credentials, perform unsigned direct upload
    if (this.isConfigured()) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Cloudinary upload failed with status ${response.status}`);
        }

        const data = await response.json();
        const rawUrl = data.secure_url || data.url || '';
        const secureUrl = rawUrl.replace(/^http:\/\//i, 'https://');

        return {
          url: secureUrl,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
        };
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        throw err;
      }
    }

    // Fallback: Read file as Data URL (instant preview & local persistence while credentials are added)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
        });
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file locally.'));
      };
      reader.readAsDataURL(file);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
