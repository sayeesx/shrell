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
import {
  IBrandRepository,
  ICategoryRepository,
  ICouponRepository,
  IInventoryRepository,
  IOrderRepository,
  IProductRepository,
  ISettingsRepository,
  IVehicleRepository,
  ProductFilterParams,
} from './types';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_COMPATIBILITY,
  INITIAL_COUPONS,
  INITIAL_MAKES,
  INITIAL_MODELS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_VARIANTS,
} from './seedData';

const STORAGE_KEYS = {
  PRODUCTS: 'shrell_products_v4',
  CATEGORIES: 'shrell_categories_v4',
  BRANDS: 'shrell_brands_v3',
  ORDERS: 'shrell_orders_v2',
  INVENTORY_MOVEMENTS: 'shrell_inventory_movements_v2',
  SETTINGS: 'shrell_settings_v1',
  COUPONS: 'shrell_coupons_v2',
  COMPATIBILITY: 'shrell_compatibility_v2',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save to localStorage [${key}]:`, err);
  }
}

// ===================== PRODUCT REPOSITORY =====================

export class MockProductRepository implements IProductRepository {
  private products: Product[];
  private categories: Category[];
  private brands: Brand[];
  private compatibility: VehicleCompatibility[];

  constructor() {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.brands = loadFromStorage(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    this.compatibility = loadFromStorage(STORAGE_KEYS.COMPATIBILITY, INITIAL_COMPATIBILITY);
  }

  async getAll(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.brands = loadFromStorage(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    this.compatibility = loadFromStorage(STORAGE_KEYS.COMPATIBILITY, INITIAL_COMPATIBILITY);

    let result = [...this.products].filter((p) => p.isActive);

    if (params?.categorySlug) {
      const q = params.categorySlug.toLowerCase();
      const cat = this.categories.find(
        (c) =>
          c.slug.toLowerCase() === q ||
          c.id.toLowerCase() === q ||
          c.name.toLowerCase().includes(q) ||
          (q.includes('fresh') && c.slug.includes('freshener')) ||
          (q.includes('mat') && c.slug.includes('protection')) ||
          (q.includes('light') && c.slug.includes('lighting')) ||
          (q.includes('tyre') && c.slug.includes('tyre')) ||
          (q.includes('tool') && c.slug.includes('touring')) ||
          (q.includes('recovery') && c.slug.includes('touring'))
      );
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.id);
      } else {
        result = result.filter(
          (p) =>
            p.categoryId.toLowerCase().includes(q) ||
            p.categoryName?.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
        );
      }
    }

    if (params?.brandSlug) {
      const brand = this.brands.find((b) => b.slug === params.brandSlug);
      if (brand) {
        result = result.filter((p) => p.brandId === brand.id);
      }
    }

    if (params?.vehicleModelId) {
      const modelId = params.vehicleModelId;
      result = result.filter((p) => {
        if (p.isUniversalFit) return true;
        return this.compatibility.some((c) => c.productId === p.id && c.modelId === modelId);
      });
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }

    if (params?.inStockOnly) {
      result = result.filter((p) => p.stockQuantity > 0);
    }

    if (params?.minPricePaisa !== undefined) {
      result = result.filter((p) => p.pricePaisa >= (params.minPricePaisa || 0));
    }

    if (params?.maxPricePaisa !== undefined) {
      result = result.filter((p) => p.pricePaisa <= (params.maxPricePaisa || Infinity));
    }

    if (params?.sort === 'price_asc') {
      result.sort((a, b) => a.pricePaisa - b.pricePaisa);
    } else if (params?.sort === 'price_desc') {
      result.sort((a, b) => b.pricePaisa - a.pricePaisa);
    } else if (params?.sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = result.length;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return { products: paginated, total };
  }

  async getBySlug(slug: string): Promise<Product | null> {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const p = this.products.find((prod) => prod.slug === slug);
    return p ? { ...p } : null;
  }

  async getById(id: string): Promise<Product | null> {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const p = this.products.find((prod) => prod.id === id);
    return p ? { ...p } : null;
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const id = `prod-${Date.now()}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    return newProduct;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product not found: ${id}`);

    const updated: Product = {
      ...this.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.products[idx] = updated;
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.products = this.products.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    return true;
  }
}

// ===================== CATEGORY REPOSITORY =====================

export class MockCategoryRepository implements ICategoryRepository {
  private categories: Category[];

  constructor() {
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  async getAll(): Promise<Category[]> {
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBySlug(slug: string): Promise<Category | null> {
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const c = this.categories.find((cat) => cat.slug === slug);
    return c ? { ...c } : null;
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    this.categories.push(newCat);
    saveToStorage(STORAGE_KEYS.CATEGORIES, this.categories);
    return newCat;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Category not found: ${id}`);
    const updated = { ...this.categories[idx], ...updates };
    this.categories[idx] = updated;
    saveToStorage(STORAGE_KEYS.CATEGORIES, this.categories);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.categories = this.categories.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.CATEGORIES, this.categories);
    return true;
  }
}

// ===================== BRAND REPOSITORY =====================

export class MockBrandRepository implements IBrandRepository {
  private brands: Brand[];

  constructor() {
    this.brands = loadFromStorage(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
  }

  async getAll(): Promise<Brand[]> {
    this.brands = loadFromStorage(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    return [...this.brands].filter((b) => b.isActive);
  }

  async create(brand: Omit<Brand, 'id'>): Promise<Brand> {
    this.brands = loadFromStorage(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    const newBrand: Brand = {
      ...brand,
      id: `brand-${Date.now()}`,
    };
    this.brands.push(newBrand);
    saveToStorage(STORAGE_KEYS.BRANDS, this.brands);
    return newBrand;
  }
}

// ===================== VEHICLE REPOSITORY =====================

export class MockVehicleRepository implements IVehicleRepository {
  private makes: VehicleMake[] = INITIAL_MAKES;
  private models: VehicleModel[] = INITIAL_MODELS;
  private variants: VehicleVariant[] = INITIAL_VARIANTS;
  private compatibility: VehicleCompatibility[];

  constructor() {
    this.compatibility = loadFromStorage(STORAGE_KEYS.COMPATIBILITY, INITIAL_COMPATIBILITY);
  }

  async getMakes(): Promise<VehicleMake[]> {
    return [...this.makes];
  }

  async getModelsByMake(makeId: string): Promise<VehicleModel[]> {
    return this.models.filter((m) => m.makeId === makeId);
  }

  async getVariantsByModel(modelId: string): Promise<VehicleVariant[]> {
    return this.variants.filter((v) => v.modelId === modelId);
  }

  async getCompatibilityForProduct(productId: string): Promise<VehicleCompatibility[]> {
    this.compatibility = loadFromStorage(STORAGE_KEYS.COMPATIBILITY, INITIAL_COMPATIBILITY);
    return this.compatibility.filter((c) => c.productId === productId);
  }

  async setProductCompatibility(
    productId: string,
    compatibilities: Omit<VehicleCompatibility, 'id'>[]
  ): Promise<void> {
    this.compatibility = loadFromStorage(STORAGE_KEYS.COMPATIBILITY, INITIAL_COMPATIBILITY);
    this.compatibility = this.compatibility.filter((c) => c.productId !== productId);
    const newEntries: VehicleCompatibility[] = compatibilities.map((c, i) => ({
      ...c,
      id: `compat-${productId}-${i}-${Date.now()}`,
      productId,
    }));
    this.compatibility.push(...newEntries);
    saveToStorage(STORAGE_KEYS.COMPATIBILITY, this.compatibility);
  }
}

// ===================== INVENTORY REPOSITORY =====================

export class MockInventoryRepository implements IInventoryRepository {
  private movements: InventoryMovement[];

  constructor() {
    this.movements = loadFromStorage(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  }

  async getStock(productId: string): Promise<{ onHand: number; reserved: number; available: number }> {
    const products: Product[] = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const p = products.find((prod) => prod.id === productId);
    const onHand = p?.stockQuantity || 0;
    return { onHand, reserved: 0, available: onHand };
  }

  async adjustStock(
    productId: string,
    quantityChange: number,
    movementType: InventoryMovement['movementType'],
    notes: string,
    referenceId: string
  ): Promise<void> {
    const products: Product[] = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const p = products.find((prod) => prod.id === productId);
    if (!p) throw new Error(`Product not found: ${productId}`);

    const newStock = Math.max(0, p.stockQuantity + quantityChange);
    p.stockQuantity = newStock;
    p.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    this.movements = loadFromStorage(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
    const movement: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId,
      productSku: p.sku,
      productName: p.name,
      quantityChange,
      movementType,
      referenceId,
      notes,
      createdAt: new Date().toISOString(),
    };
    this.movements.unshift(movement);
    saveToStorage(STORAGE_KEYS.INVENTORY_MOVEMENTS, this.movements);
  }

  async getMovements(productId?: string): Promise<InventoryMovement[]> {
    this.movements = loadFromStorage(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
    if (productId) {
      return this.movements.filter((m) => m.productId === productId);
    }
    return [...this.movements];
  }
}

// ===================== ORDER REPOSITORY =====================

export class MockOrderRepository implements IOrderRepository {
  private orders: Order[];

  constructor() {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    const products: Product[] = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    const existing = this.orders.find((o) => o.idempotencyKey === orderData.idempotencyKey);
    if (existing) {
      return existing;
    }

    // Atomic Stock Deduction check
    for (const item of orderData.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product ${item.productName} not found in catalogue`);
      }
      if (prod.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${prod.name}. Available: ${prod.stockQuantity}`);
      }
    }

    const orderSeq = this.orders.length + 101;
    const year = new Date().getFullYear();
    const id = `SHR-${year}-${orderSeq.toString().padStart(5, '0')}`;
    const now = new Date().toISOString();

    const order: Order = {
      ...orderData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Deduct stock
    for (const item of order.items) {
      const p = products.find((prod) => prod.id === item.productId);
      if (p) {
        p.stockQuantity = Math.max(0, p.stockQuantity - item.quantity);
        p.updatedAt = now;
      }
    }
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    this.orders.unshift(order);
    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);

    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    const o = this.orders.find((ord) => ord.id === id);
    return o ? { ...o } : null;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    return this.orders.filter((o) => o.customerId === customerId);
  }

  async getAllOrders(filters?: { status?: string; paymentStatus?: string; search?: string }): Promise<Order[]> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    let result = [...this.orders];
    if (filters?.status) {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters?.paymentStatus) {
      result = result.filter((o) => o.paymentStatus === filters.paymentStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.shippingAddress.postalCode.includes(q)
      );
    }
    return result;
  }

  async updateOrderStatus(id: string, status: Order['status'], internalNotes?: string): Promise<Order> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Order not found: ${id}`);

    const existing = this.orders[idx];
    const updated: Order = {
      ...existing,
      status,
      internalNotes: internalNotes
        ? `${existing.internalNotes || ''}\n[${new Date().toISOString()}] ${internalNotes}`.trim()
        : existing.internalNotes,
      updatedAt: new Date().toISOString(),
    };

    this.orders[idx] = updated;
    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    return updated;
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: Order['paymentStatus'],
    reference?: string
  ): Promise<Order> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Order not found: ${id}`);

    const existing = this.orders[idx];
    const updated: Order = {
      ...existing,
      paymentStatus,
      paymentReference: reference || existing.paymentReference,
      status: paymentStatus === 'VERIFIED' && existing.status === 'PENDING' ? 'CONFIRMED' : existing.status,
      updatedAt: new Date().toISOString(),
    };
    this.orders[idx] = updated;
    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    return updated;
  }

  async updateShipment(orderId: string, shipment: Order['shipment']): Promise<Order> {
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, []);
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error(`Order not found: ${orderId}`);

    const existing = this.orders[idx];
    const updated: Order = {
      ...existing,
      shipment,
      status: shipment ? 'SHIPPED' : existing.status,
      updatedAt: new Date().toISOString(),
    };
    this.orders[idx] = updated;
    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    return updated;
  }
}

// ===================== COUPON REPOSITORY =====================

export class MockCouponRepository implements ICouponRepository {
  private coupons: Coupon[];

  constructor() {
    this.coupons = loadFromStorage(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  }

  async getByCode(code: string): Promise<Coupon | null> {
    this.coupons = loadFromStorage(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
    const c = this.coupons.find((coup) => coup.code.toUpperCase() === code.toUpperCase() && coup.isActive);
    return c ? { ...c } : null;
  }

  async getAll(): Promise<Coupon[]> {
    this.coupons = loadFromStorage(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
    return [...this.coupons];
  }

  async create(coupon: Omit<Coupon, 'id' | 'usedCount'>): Promise<Coupon> {
    this.coupons = loadFromStorage(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
    const newCoupon: Coupon = {
      ...coupon,
      id: `coupon-${Date.now()}`,
      usedCount: 0,
    };
    this.coupons.push(newCoupon);
    saveToStorage(STORAGE_KEYS.COUPONS, this.coupons);
    return newCoupon;
  }

  async incrementUsage(code: string): Promise<void> {
    this.coupons = loadFromStorage(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
    const c = this.coupons.find((coup) => coup.code.toUpperCase() === code.toUpperCase());
    if (c) {
      c.usedCount += 1;
      saveToStorage(STORAGE_KEYS.COUPONS, this.coupons);
    }
  }
}

// ===================== SETTINGS REPOSITORY =====================

export class MockSettingsRepository implements ISettingsRepository {
  private settings: StoreSettings;

  constructor() {
    this.settings = loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  async getSettings(): Promise<StoreSettings> {
    this.settings = loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    this.settings = loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.settings = { ...this.settings, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    return { ...this.settings };
  }
}
