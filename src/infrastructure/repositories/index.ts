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

export const productRepository: IProductRepository = isAppwriteConfigured
  ? appwriteProductRepo
  : mockProductRepo;

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

export function getRepositoryMode(): 'APPWRITE_CLOUD' | 'PERSISTENT_LOCAL_STORAGE' {
  return isAppwriteConfigured ? 'APPWRITE_CLOUD' : 'PERSISTENT_LOCAL_STORAGE';
}

export { bannerRepository } from './bannerRepository';
