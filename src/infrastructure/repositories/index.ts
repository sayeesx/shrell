import { isAppwriteConfigured } from '../appwrite/client';
import {
  AppwriteCategoryRepository,
  AppwriteOrderRepository,
  AppwriteProductRepository,
  AppwriteSettingsRepository,
} from './AppwriteRepository';
import {
  MockBrandRepository,
  MockCategoryRepository,
  MockCouponRepository,
  MockInventoryRepository,
  MockOrderRepository,
  MockProductRepository,
  MockSettingsRepository,
  MockVehicleRepository,
} from './MockPersistenceRepository';
import {
  IBrandRepository,
  ICategoryRepository,
  ICouponRepository,
  IInventoryRepository,
  IOrderRepository,
  IProductRepository,
  ISettingsRepository,
  IVehicleRepository,
} from './types';

// Mock instances
const mockProductRepo = new MockProductRepository();
const mockCategoryRepo = new MockCategoryRepository();
const mockBrandRepo = new MockBrandRepository();
const mockVehicleRepo = new MockVehicleRepository();
const mockInventoryRepo = new MockInventoryRepository();
const mockOrderRepo = new MockOrderRepository();
const mockCouponRepo = new MockCouponRepository();
const mockSettingsRepo = new MockSettingsRepository();

// Appwrite instances
const appwriteProductRepo = new AppwriteProductRepository();
const appwriteCategoryRepo = new AppwriteCategoryRepository();
const appwriteOrderRepo = new AppwriteOrderRepository();
const appwriteSettingsRepo = new AppwriteSettingsRepository();

import { sanityProductRepository, sanityBannerRepository } from '../sanity/SanityRepository';
import { isSanityConfigured } from '../sanity/sanityConfig';

// Unified Product Repository supporting Sanity CMS, Appwrite, and local persistence
class UnifiedProductRepository implements IProductRepository {
  private getBaseRepo(): IProductRepository {
    return isAppwriteConfigured ? appwriteProductRepo : mockProductRepo;
  }

  async getAll(options?: any): Promise<any> {
    if (isSanityConfigured()) {
      try {
        const sanityResult = await sanityProductRepository.getAll(options);
        if (sanityResult && sanityResult.products && sanityResult.products.length > 0) {
          return sanityResult;
        }
      } catch (e) {
        console.warn('Sanity read fallback:', e);
      }
    }
    return this.getBaseRepo().getAll(options);
  }

  async getById(id: string): Promise<any> {
    if (isSanityConfigured()) {
      try {
        const p = await sanityProductRepository.getById(id);
        if (p) return p;
      } catch (_) {}
    }
    return this.getBaseRepo().getById(id);
  }

  async getBySlug(slug: string): Promise<any> {
    if (isSanityConfigured()) {
      try {
        const p = await sanityProductRepository.getBySlug(slug);
        if (p) return p;
      } catch (_) {}
    }
    return this.getBaseRepo().getBySlug(slug);
  }

  async getFeatured(): Promise<any> {
    if (isSanityConfigured()) {
      try {
        const featured = await sanityProductRepository.getFeatured();
        if (featured && featured.length > 0) return featured;
      } catch (_) {}
    }
    const all = await this.getBaseRepo().getAll();
    return all.products.filter((p) => p.isFeatured);
  }

  create(product: any): Promise<any> {
    return this.getBaseRepo().create(product);
  }

  update(id: string, updates: any): Promise<any> {
    return this.getBaseRepo().update(id, updates);
  }

  delete(id: string): Promise<boolean> {
    return this.getBaseRepo().delete(id);
  }
}

export const productRepository: IProductRepository = new UnifiedProductRepository();

export const categoryRepository: ICategoryRepository = isAppwriteConfigured
  ? appwriteCategoryRepo
  : mockCategoryRepo;

export const brandRepository: IBrandRepository = mockBrandRepo;
export const vehicleRepository: IVehicleRepository = mockVehicleRepo;
export const inventoryRepository: IInventoryRepository = mockInventoryRepo;

export const orderRepository: IOrderRepository = isAppwriteConfigured
  ? appwriteOrderRepo
  : mockOrderRepo;

export const couponRepository: ICouponRepository = mockCouponRepo;

export const settingsRepository: ISettingsRepository = isAppwriteConfigured
  ? appwriteSettingsRepo
  : mockSettingsRepo;

export function getRepositoryMode(): 'SANITY_CMS' | 'APPWRITE_CLOUD' | 'PERSISTENT_LOCAL_STORAGE' {
  if (isSanityConfigured()) return 'SANITY_CMS';
  return isAppwriteConfigured ? 'APPWRITE_CLOUD' : 'PERSISTENT_LOCAL_STORAGE';
}

export { bannerRepository } from './bannerRepository';
export { sanityProductRepository, sanityBannerRepository };

