import { isAppwriteConfigured } from '../appwrite/client';
import { isSupabaseConfigured } from '../supabase/client';
import {
  AppwriteCategoryRepository,
  AppwriteOrderRepository,
  AppwriteProductRepository,
  AppwriteSettingsRepository,
} from './AppwriteRepository';
import {
  SupabaseBrandRepository,
  SupabaseCategoryRepository,
  SupabaseCouponRepository,
  SupabaseInventoryRepository,
  SupabaseOrderRepository,
  SupabaseProductRepository,
  SupabaseSettingsRepository,
  SupabaseVehicleRepository,
} from './SupabaseRepository';
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

// Supabase instances
const supabaseProductRepo = new SupabaseProductRepository();
const supabaseCategoryRepo = new SupabaseCategoryRepository();
const supabaseBrandRepo = new SupabaseBrandRepository();
const supabaseVehicleRepo = new SupabaseVehicleRepository();
const supabaseInventoryRepo = new SupabaseInventoryRepository();
const supabaseOrderRepo = new SupabaseOrderRepository();
const supabaseCouponRepo = new SupabaseCouponRepository();
const supabaseSettingsRepo = new SupabaseSettingsRepository();

import { sanityProductRepository, sanityBannerRepository } from '../sanity/SanityRepository';
import { isSanityConfigured } from '../sanity/sanityConfig';

// Unified Product Repository supporting Sanity CMS, Supabase, Appwrite, and local persistence
class UnifiedProductRepository implements IProductRepository {
  private getBaseRepo(): IProductRepository {
    if (isSupabaseConfigured) return supabaseProductRepo;
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
    return all.products.filter((p: any) => p.isFeatured);
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

export const categoryRepository: ICategoryRepository = isSupabaseConfigured
  ? supabaseCategoryRepo
  : isAppwriteConfigured
    ? appwriteCategoryRepo
    : mockCategoryRepo;

export const brandRepository: IBrandRepository = isSupabaseConfigured
  ? supabaseBrandRepo
  : mockBrandRepo;

export const vehicleRepository: IVehicleRepository = isSupabaseConfigured
  ? supabaseVehicleRepo
  : mockVehicleRepo;

export const inventoryRepository: IInventoryRepository = isSupabaseConfigured
  ? supabaseInventoryRepo
  : mockInventoryRepo;

export const orderRepository: IOrderRepository = isSupabaseConfigured
  ? supabaseOrderRepo
  : isAppwriteConfigured
    ? appwriteOrderRepo
    : mockOrderRepo;

export const couponRepository: ICouponRepository = isSupabaseConfigured
  ? supabaseCouponRepo
  : mockCouponRepo;

export const settingsRepository: ISettingsRepository = isSupabaseConfigured
  ? supabaseSettingsRepo
  : isAppwriteConfigured
    ? appwriteSettingsRepo
    : mockSettingsRepo;

export function getRepositoryMode(): 'SUPABASE_POSTGRES' | 'SANITY_CMS' | 'APPWRITE_CLOUD' | 'PERSISTENT_LOCAL_STORAGE' {
  if (isSupabaseConfigured) return 'SUPABASE_POSTGRES';
  if (isSanityConfigured()) return 'SANITY_CMS';
  return isAppwriteConfigured ? 'APPWRITE_CLOUD' : 'PERSISTENT_LOCAL_STORAGE';
}

export { bannerRepository } from './bannerRepository';
export { sanityProductRepository, sanityBannerRepository };
