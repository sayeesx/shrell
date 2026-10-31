import {
  Brand,
  Category,
  Coupon,
  InventoryMovement,
  Order,
  Product,
  StoreSettings,
  VehicleCompatibility,
  VehicleMake,
  VehicleModel,
  VehicleVariant,
} from '../../domain/types';

export interface ProductFilterParams {
  categorySlug?: string;
  brandSlug?: string;
  vehicleModelId?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name';
  inStockOnly?: boolean;
  minPricePaisa?: number;
  maxPricePaisa?: number;
  page?: number;
  limit?: number;
}

export interface IProductRepository {
  getAll(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<boolean>;
}

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
  create(category: Omit<Category, 'id'>): Promise<Category>;
  update(id: string, updates: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<boolean>;
}

export interface IBrandRepository {
  getAll(): Promise<Brand[]>;
  create(brand: Omit<Brand, 'id'>): Promise<Brand>;
}

export interface IVehicleRepository {
  getMakes(): Promise<VehicleMake[]>;
  getModelsByMake(makeId: string): Promise<VehicleModel[]>;
  getVariantsByModel(modelId: string): Promise<VehicleVariant[]>;
  getCompatibilityForProduct(productId: string): Promise<VehicleCompatibility[]>;
  setProductCompatibility(productId: string, compatibilities: Omit<VehicleCompatibility, 'id'>[]): Promise<void>;
}

export interface IInventoryRepository {
  getStock(productId: string): Promise<{ onHand: number; reserved: number; available: number }>;
  adjustStock(
    productId: string,
    quantityChange: number,
    movementType: InventoryMovement['movementType'],
    notes: string,
    referenceId: string
  ): Promise<void>;
  getMovements(productId?: string): Promise<InventoryMovement[]>;
}

export interface IOrderRepository {
  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getAllOrders(filters?: { status?: string; paymentStatus?: string; search?: string }): Promise<Order[]>;
  updateOrderStatus(id: string, status: Order['status'], internalNotes?: string): Promise<Order>;
  updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus'], reference?: string): Promise<Order>;
  updateShipment(orderId: string, shipment: Order['shipment']): Promise<Order>;
}

export interface ICouponRepository {
  getByCode(code: string): Promise<Coupon | null>;
  getAll(): Promise<Coupon[]>;
  create(coupon: Omit<Coupon, 'id' | 'usedCount'>): Promise<Coupon>;
  incrementUsage(code: string): Promise<void>;
}

export interface ISettingsRepository {
  getSettings(): Promise<StoreSettings>;
  updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
}
