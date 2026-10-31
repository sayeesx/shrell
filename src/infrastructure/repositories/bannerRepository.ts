import { HeroBanner } from '../../domain/types';

const PRIMARY_KEY = 'shrell_hero_banners';
const FALLBACK_KEY = 'vahn_hero_banners';

const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: 'banner-01',
    desktopImageUrl: '/shrell-opengraph.png',
    mobileImageUrl: '/shrell-opengraph.png',
    targetUrl: '/catalogue',
    altText: 'SHRELL Premium Automotive Overland Equipment',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'banner-02',
    desktopImageUrl: '/logos/shrell-full_white-text_black-logo.png',
    mobileImageUrl: '/logos/shrell-full_white-text_black-logo.png',
    targetUrl: '/catalogue?category=roof-racks-cargo',
    altText: 'Aerodynamic Roof Cargo Systems',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
];

export interface IBannerRepository {
  getAll(): Promise<HeroBanner[]>;
  getAllForAdmin(): Promise<HeroBanner[]>;
  create(banner: Omit<HeroBanner, 'id' | 'createdAt'>): Promise<HeroBanner>;
  update(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner>;
  delete(id: string): Promise<boolean>;
}

class BannerRepository implements IBannerRepository {
  private getStoredBanners(): HeroBanner[] {
    try {
      const data = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(FALLBACK_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse stored banners:', e);
    }
    // Initialize defaults if not configured yet
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
    const banners = this.getStoredBanners();
    return banners
      .filter((b) => b.isActive)
      .sort((a, b) => a.order - b.order);
  }

  async getAllForAdmin(): Promise<HeroBanner[]> {
    const banners = this.getStoredBanners();
    return banners.sort((a, b) => a.order - b.order);
  }

  async create(bannerData: Omit<HeroBanner, 'id' | 'createdAt'>): Promise<HeroBanner> {
    const banners = this.getStoredBanners();
    const newBanner: HeroBanner = {
      ...bannerData,
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    banners.push(newBanner);
    this.setStoredBanners(banners);
    return newBanner;
  }

  async update(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner> {
    const banners = this.getStoredBanners();
    const index = banners.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Banner with ID ${id} not found.`);
    }
    banners[index] = {
      ...banners[index],
      ...updates,
    };
    this.setStoredBanners(banners);
    return banners[index];
  }

  async delete(id: string): Promise<boolean> {
    let banners = this.getStoredBanners();
    const initialLen = banners.length;
    banners = banners.filter((b) => b.id !== id);
    this.setStoredBanners(banners);
    return banners.length < initialLen;
  }
}

export const bannerRepository = new BannerRepository();
