import { HeroBanner } from '../../domain/types';

const STORAGE_KEY = 'vahn_hero_banners';

const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: 'banner-01',
    desktopImageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&h=500&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&h=450&q=85',
    targetUrl: '/catalogue',
    altText: 'Festive Season Overland Accessories',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'banner-02',
    desktopImageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&h=500&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&h=450&q=85',
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
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse stored banners:', e);
    }
    // Initialize defaults if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BANNERS));
    return DEFAULT_BANNERS;
  }

  private setStoredBanners(banners: HeroBanner[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
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
