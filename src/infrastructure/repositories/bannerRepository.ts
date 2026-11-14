import { HeroBanner } from '../../domain/types';
import {
  fetchSanityBanners,
  createSanityBanner,
  deleteSanityBanner,
  toggleSanityBannerActive,
} from '../sanity/sanityClient';
import { isSanityConfigured } from '../sanity/sanityConfig';

const PRIMARY_KEY = 'shrell_hero_banners';
const FALLBACK_KEY = 'vahn_hero_banners';

const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: 'banner-01',
    desktopImageUrl: 'https://res.cloudinary.com/dy1i55fut/image/upload/v1793512009/uykqili5ey5zhdkdondv.png',
    mobileImageUrl: 'https://res.cloudinary.com/dy1i55fut/image/upload/v1793512009/uykqili5ey5zhdkdondv.png',
    targetUrl: '/catalogue',
    altText: 'SHRELL Premium Automotive Equipment',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'banner-02',
    desktopImageUrl: 'https://res.cloudinary.com/dy1i55fut/image/upload/v1793512017/xdcqllkepn85jebh4gqj.webp',
    mobileImageUrl: 'https://res.cloudinary.com/dy1i55fut/image/upload/v1793512017/xdcqllkepn85jebh4gqj.webp',
    targetUrl: '/catalogue',
    altText: 'SHRELL Precision Engineered Automotive Systems',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
];

export interface IBannerRepository {
  getAll(): Promise<HeroBanner[]>;
  getAllForAdmin(): Promise<HeroBanner[]>;
  create(banner: Omit<HeroBanner, 'id' | 'createdAt'> & {
    desktopImageFile?: File | Blob;
    mobileImageFile?: File | Blob;
  }): Promise<HeroBanner>;
  update(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner>;
  delete(id: string): Promise<boolean>;
}

class BannerRepository implements IBannerRepository {
  private getStoredBanners(): HeroBanner[] {
    try {
      const data = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(FALLBACK_KEY);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map((b) => {
            let desktop = b.desktopImageUrl || '';
            let mobile = b.mobileImageUrl || '';

            // Upgrade legacy relative default paths to live Cloudinary banners
            if (!desktop || desktop.includes('shrell-opengraph') || desktop.includes('shrell-brandicon')) {
              desktop = DEFAULT_BANNERS[0].desktopImageUrl;
            }
            if (!mobile || mobile.includes('shrell-opengraph') || mobile.includes('shrell-brandicon')) {
              mobile = DEFAULT_BANNERS[0].mobileImageUrl;
            }

            if (desktop.startsWith('http://')) desktop = desktop.replace(/^http:\/\//, 'https://');
            if (mobile.startsWith('http://')) mobile = mobile.replace(/^http:\/\//, 'https://');

            return {
              ...b,
              desktopImageUrl: desktop,
              mobileImageUrl: mobile,
            };
          });

          // If changes were made, persist updated Cloudinary links
          try {
            localStorage.setItem(PRIMARY_KEY, JSON.stringify(sanitized));
          } catch (_) {}

          return sanitized;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored banners:', e);
    }
    // Initialize defaults if not configured yet or empty
    try {
      localStorage.setItem(PRIMARY_KEY, JSON.stringify(DEFAULT_BANNERS));
    } catch (e) {
      console.warn('Could not store default banners in localStorage:', e);
    }
    return DEFAULT_BANNERS;
  }

  private setStoredBanners(banners: HeroBanner[]): void {
    try {
      const serialized = JSON.stringify(banners);
      localStorage.setItem(PRIMARY_KEY, serialized);
      localStorage.setItem(FALLBACK_KEY, serialized);
    } catch (e) {
      console.error('Failed to save banners to localStorage:', e);
      throw new Error('Storage quota exceeded. Please upload smaller images or delete unused slides.');
    }
  }

  async getAll(): Promise<HeroBanner[]> {
    if (isSanityConfigured()) {
      try {
        const sanityDocs = await fetchSanityBanners(false);
        if (sanityDocs && sanityDocs.length > 0) {
          return sanityDocs.map((d: any, idx: number) => ({
            id: d._id,
            desktopImageUrl: d.desktopImageUrl,
            mobileImageUrl: d.mobileImageUrl || d.desktopImageUrl,
            targetUrl: d.targetUrl || '/catalogue',
            altText: d.altText || d.title || 'SHRELL Banner',
            isActive: d.isActive !== false,
            order: d.order || idx + 1,
            createdAt: d._createdAt || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch banners from Sanity, using fallback:', err);
      }
    }

    const banners = this.getStoredBanners();
    const active = banners
      .filter((b) => b.isActive)
      .sort((a, b) => a.order - b.order);
    if (active.length === 0) {
      return DEFAULT_BANNERS;
    }
    return active;
  }

  async getAllForAdmin(): Promise<HeroBanner[]> {
    if (isSanityConfigured()) {
      try {
        const sanityDocs = await fetchSanityBanners(true);
        if (sanityDocs && sanityDocs.length > 0) {
          return sanityDocs.map((d: any, idx: number) => ({
            id: d._id,
            desktopImageUrl: d.desktopImageUrl,
            mobileImageUrl: d.mobileImageUrl || d.desktopImageUrl,
            targetUrl: d.targetUrl || '/catalogue',
            altText: d.altText || d.title || 'SHRELL Banner',
            isActive: d.isActive !== false,
            order: d.order || idx + 1,
            createdAt: d._createdAt || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch admin banners from Sanity, using fallback:', err);
      }
    }

    const banners = this.getStoredBanners();
    return banners.sort((a, b) => a.order - b.order);
  }

  async create(
    bannerData: Omit<HeroBanner, 'id' | 'createdAt'> & {
      desktopImageFile?: File | Blob;
      mobileImageFile?: File | Blob;
    }
  ): Promise<HeroBanner> {
    const { desktopImageFile, mobileImageFile, ...cleanData } = bannerData;
    const banners = this.getStoredBanners();
    const newBanner: HeroBanner = {
      ...cleanData,
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    banners.push(newBanner);
    this.setStoredBanners(banners);

    if (isSanityConfigured()) {
      try {
        const res = await createSanityBanner({
          title: bannerData.altText || 'Hero Banner',
          altText: bannerData.altText,
          targetUrl: bannerData.targetUrl,
          order: bannerData.order,
          isActive: bannerData.isActive,
          desktopImageFile,
          mobileImageFile,
          desktopImageUrl: bannerData.desktopImageUrl,
          mobileImageUrl: bannerData.mobileImageUrl,
        });
        if (res.success && res.id) {
          newBanner.id = res.id;
        }
      } catch (e) {
        console.warn('Failed to create banner in Sanity:', e);
      }
    }

    return newBanner;
  }

  async update(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner> {
    if (isSanityConfigured() && updates.isActive !== undefined) {
      try {
        await toggleSanityBannerActive(id, updates.isActive);
      } catch (e) {
        console.warn('Failed to update banner in Sanity:', e);
      }
    }

    const banners = this.getStoredBanners();
    const index = banners.findIndex((b) => b.id === id);
    if (index !== -1) {
      banners[index] = {
        ...banners[index],
        ...updates,
      };
      this.setStoredBanners(banners);
      return banners[index];
    }
    return {
      id,
      desktopImageUrl: '',
      mobileImageUrl: '',
      targetUrl: '/catalogue',
      altText: 'Hero Banner',
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString(),
      ...updates,
    };
  }

  async delete(id: string): Promise<boolean> {
    if (isSanityConfigured()) {
      try {
        await deleteSanityBanner(id);
      } catch (e) {
        console.warn('Failed to delete banner in Sanity:', e);
      }
    }

    let banners = this.getStoredBanners();
    const initialLen = banners.length;
    banners = banners.filter((b) => b.id !== id);
    this.setStoredBanners(banners);
    return banners.length < initialLen;
  }
}

export const bannerRepository = new BannerRepository();
