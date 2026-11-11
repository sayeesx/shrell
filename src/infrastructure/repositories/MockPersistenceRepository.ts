import {
  Brand,
  Category,
  Coupon,
  HomeSection,
  InventoryMovement,
  Order,
  Product,
  ProductRatingSummary,
  ProductReview,
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
  IHomeSectionRepository,
  IInventoryRepository,
  IOrderRepository,
  IProductRepository,
  IReviewRepository,
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
  REVIEWS: 'shrell_reviews_v1',
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
          (q.includes('recovery') && c.slug.includes('touring')) ||
          (q.includes('wash') && (c.slug.includes('wash') || c.slug.includes('care'))) ||
          (q.includes('charg') && (c.slug.includes('charg') || c.slug.includes('touring') || c.slug.includes('power')))
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

  async getAllCoupons(): Promise<Coupon[]> {
    return this.getAll();
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

// ===================== HOME SECTIONS REPOSITORY =====================

export const INITIAL_HOME_SECTIONS: HomeSection[] = [
  {
    id: 'sec-crazy-finds',
    title: 'Crazy Finds',
    subtitle: "Blink and you'll miss it",
    sectionType: 'PRODUCTS_GRID',
    displayOrder: 1,
    isActive: true,
    limit: 4,
    viewAllUrl: '/catalogue',
  },
  {
    id: 'sec-festival-deals',
    title: 'Festival Declutter Deals 🪔',
    subtitle: 'Verified genuine equipment with up to ₹15,000 instant festival discounts',
    sectionType: 'PRODUCTS_GRID',
    displayOrder: 2,
    isActive: true,
    limit: 4,
    viewAllUrl: '/catalogue',
  },
  {
    id: 'sec-editorial-bento',
    title: 'Engineering & Precision',
    subtitle: 'High-performance automotive hardware overview',
    sectionType: 'EDITORIAL_BENTO',
    displayOrder: 3,
    isActive: true,
    limit: 0,
    viewAllUrl: '/catalogue',
  },
];

export class MockHomeSectionRepository implements IHomeSectionRepository {
  private sections: HomeSection[];

  constructor() {
    this.sections = loadFromStorage('shrell_home_sections_v1', INITIAL_HOME_SECTIONS);
  }

  async getAll(): Promise<HomeSection[]> {
    this.sections = loadFromStorage('shrell_home_sections_v1', INITIAL_HOME_SECTIONS);
    return [...this.sections].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getById(id: string): Promise<HomeSection | null> {
    const list = await this.getAll();
    return list.find((s) => s.id === id) || null;
  }

  async create(section: Omit<HomeSection, 'id' | 'createdAt' | 'updatedAt'>): Promise<HomeSection> {
    this.sections = loadFromStorage('shrell_home_sections_v1', INITIAL_HOME_SECTIONS);
    const newSec: HomeSection = {
      ...section,
      id: `sec-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sections.push(newSec);
    saveToStorage('shrell_home_sections_v1', this.sections);
    return newSec;
  }

  async update(id: string, updates: Partial<HomeSection>): Promise<HomeSection> {
    this.sections = loadFromStorage('shrell_home_sections_v1', INITIAL_HOME_SECTIONS);
    const idx = this.sections.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Home section not found: ${id}`);
    this.sections[idx] = {
      ...this.sections[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage('shrell_home_sections_v1', this.sections);
    return this.sections[idx];
  }

  async delete(id: string): Promise<boolean> {
    this.sections = loadFromStorage('shrell_home_sections_v1', INITIAL_HOME_SECTIONS);
    this.sections = this.sections.filter((s) => s.id !== id);
    saveToStorage('shrell_home_sections_v1', this.sections);
    return true;
  }

  async reorder(sectionIds: string[]): Promise<void> {
    this.sections = loadFromStorage('shrell_home_sections_v1', INITIAL_HOME_SECTIONS);
    this.sections.forEach((sec) => {
      const idx = sectionIds.indexOf(sec.id);
      if (idx !== -1) {
        sec.displayOrder = idx + 1;
      }
    });
    saveToStorage('shrell_home_sections_v1', this.sections);
  }
}

// ===================== REVIEWS & RATINGS REPOSITORY =====================

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-wing-01',
    productId: 'prod-stealth-wing',
    authorName: 'Vikramaditya S.',
    rating: 5,
    title: 'Perfect fit on Scorpio-N, completely silent on highways',
    comment: 'Installed these crossbars before my Ladakh expedition. Zero wind whistle up to 120 km/h. Carried a 65kg rooftop tent without any flex. Build quality is exceptional.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'rev-wing-02',
    productId: 'prod-stealth-wing',
    authorName: 'Rohan Mehta',
    rating: 5,
    title: 'Precision engineering at its best',
    comment: 'T-track mounting works seamlessly with my Thule bike carrier. Powder coating finish is rugged and matches the factory roof rails perfectly.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'rev-wing-03',
    productId: 'prod-stealth-wing',
    authorName: 'Col. R. S. Negi',
    rating: 4,
    title: 'Solid hardware, quick delivery',
    comment: 'Delivery was prompt via BlueDart in 3 days to Dehradun. Heavy gauge aluminium extrusion and secure tamper-proof lock barrels.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'rev-light-01',
    productId: 'prod-night-raider',
    authorName: 'Arun Kumar',
    rating: 5,
    title: 'Insane light throw on dark ghat roads',
    comment: 'The amber DRL halo looks stunning and the high-output Osram chips turn pitch black mountain trails into daylight. IP67 waterproof passed pressure washer test.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'rev-light-02',
    productId: 'prod-night-raider',
    authorName: 'Deepak Joshi',
    rating: 5,
    title: 'Best auxiliary lights in this price range',
    comment: 'Wiring harness provided is heavy-gauge and automotive grade. No flickering even on rough off-road terrain. Highly recommended.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
];

export class MockReviewRepository implements IReviewRepository {
  private reviews: ProductReview[];

  constructor() {
    this.reviews = loadFromStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  }

  async getByProductId(productId: string): Promise<ProductReview[]> {
    this.reviews = loadFromStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    return this.reviews
      .filter((r) => r.productId === productId || r.productId.toLowerCase() === productId.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addReview(review: Omit<ProductReview, 'id' | 'createdAt'>): Promise<ProductReview> {
    this.reviews = loadFromStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const newRev: ProductReview = {
      ...review,
      id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      isVerifiedPurchase: review.isVerifiedPurchase ?? true,
    };
    this.reviews.unshift(newRev);
    saveToStorage(STORAGE_KEYS.REVIEWS, this.reviews);
    return newRev;
  }

  async getRatingSummary(productId: string): Promise<ProductRatingSummary> {
    const list = await this.getByProductId(productId);
    if (list.length === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    list.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[star] = (breakdown[star] || 0) + 1;
      sum += r.rating;
    });

    const averageRating = Number((sum / list.length).toFixed(1));
    return {
      averageRating,
      totalReviews: list.length,
      ratingBreakdown: breakdown,
    };
  }
}
