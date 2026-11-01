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

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dy1i55fut';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ECOMMERCE';
  }

  public isConfigured(): boolean {
    return Boolean(
      this.cloudName &&
      this.uploadPreset &&
      this.cloudName !== 'your_cloud_name' &&
      this.uploadPreset !== 'your_upload_preset'
    );
  }

  /**
   * Upload an image file without compression or background alteration.
   */
  public async uploadImage(file: File): Promise<CloudinaryUploadResult> {
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
        const secureUrl = rawUrl.startsWith('http://')
          ? rawUrl.replace(/^http:\/\//, 'https://')
          : rawUrl;
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

    // Fallback: Read file as Data URL (instant local preview & persistence while credentials are added)
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
