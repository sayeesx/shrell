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
import { supabase, isSupabaseConfigured } from '../supabase/client';
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
  MockCategoryRepository,
  MockCouponRepository,
  MockHomeSectionRepository,
  MockInventoryRepository,
  MockOrderRepository,
  MockProductRepository,
  MockReviewRepository,
  MockSettingsRepository,
  MockVehicleRepository,
} from './MockPersistenceRepository';

// ==============================================================================
// FREE-TIER EGRESS & LATENCY OPTIMIZATION CACHE (TTL: 5 Minutes)
// Eliminates repetitive Supabase requests for static/rarely changing tables
// ==============================================================================
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const TTL_FIVE_MINUTES_MS = 5 * 60 * 1000;

let cachedCategories: CacheEntry<Category[]> | null = null;
let cachedBrands: CacheEntry<Brand[]> | null = null;
let cachedSettings: CacheEntry<StoreSettings> | null = null;
let cachedHomeSections: CacheEntry<HomeSection[]> | null = null;

// ==============================================================================
// 1. PRODUCTS REPOSITORY
// ==============================================================================
export class SupabaseProductRepository implements IProductRepository {
  private fallback = new MockProductRepository();

  async getAll(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    if (!isSupabaseConfigured) {
      return this.fallback.getAll(params);
    }

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (params?.categorySlug) {
        // Resolve category ID from memory cache or query with 0 unnecessary egress
        let catId: string | undefined = cachedCategories?.data.find(
          (c) => c.slug === params.categorySlug
        )?.id;
        if (!catId) {
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', params.categorySlug)
            .maybeSingle();
          if (cat) catId = cat.id;
        }
        if (catId) {
          query = query.eq('category_id', catId);
        }
      }

      if (params?.brandSlug) {
        // Resolve brand ID from memory cache or query
        let brandId: string | undefined = cachedBrands?.data.find(
          (b) => b.slug === params.brandSlug
        )?.id;
        if (!brandId) {
          const { data: brand } = await supabase
            .from('brands')
            .select('id')
            .eq('slug', params.brandSlug)
            .maybeSingle();
          if (brand) brandId = brand.id;
        }
        if (brandId) {
          query = query.eq('brand_id', brandId);
        }
      }

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      if (params?.inStockOnly) {
        query = query.gt('stock_quantity', 0);
      }

      if (params?.minPricePaisa !== undefined) {
        query = query.gte('price_paisa', params.minPricePaisa);
      }

      if (params?.maxPricePaisa !== undefined) {
        query = query.lte('price_paisa', params.maxPricePaisa);
      }

      if (params?.sort === 'price_asc') {
        query = query.order('price_paisa', { ascending: true });
      } else if (params?.sort === 'price_desc') {
        query = query.order('price_paisa', { ascending: false });
      } else if (params?.sort === 'name') {
        query = query.order('name', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const limit = params?.limit || 20;
      const page = params?.page || 1;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error || !data) {
        return this.fallback.getAll(params);
      }

      const products: Product[] = data.map((row) => this.mapRowToProduct(row));
      return { products, total: count ?? products.length };
    } catch (err) {
      console.warn('Supabase product query error, fallback to mock:', err);
      return this.fallback.getAll(params);
    }
  }

  async getBySlug(slug: string): Promise<Product | null> {
    if (!isSupabaseConfigured) {
      return this.fallback.getBySlug(slug);
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        return this.fallback.getBySlug(slug);
      }
      if (!data) return null;

      return this.mapRowToProduct(data);
    } catch {
      return this.fallback.getBySlug(slug);
    }
  }

  async getById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured) {
      return this.fallback.getById(id);
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return this.fallback.getById(id);
      }
      if (!data) return null;

      return this.mapRowToProduct(data);
    } catch {
      return this.fallback.getById(id);
    }
  }

  async getFeatured(): Promise<Product[]> {
    if (!isSupabaseConfigured) {
      const all = await this.fallback.getAll();
      return all.products.filter((p) => p.isFeatured);
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error || !data || data.length === 0) {
        const all = await this.fallback.getAll();
        return all.products.filter((p) => p.isFeatured);
      }

      return data.map((row) => this.mapRowToProduct(row));
    } catch {
      const all = await this.fallback.getAll();
      return all.products.filter((p) => p.isFeatured);
    }
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (!isSupabaseConfigured) {
      return this.fallback.create(product);
    }

    try {
      const id = `prod-${Date.now()}`;
      const payload = {
        id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        barcode: product.barcode,
        short_description: product.shortDescription,
        description: product.description,
        category_id: product.categoryId,
        category_name: product.categoryName,
        brand_id: product.brandId,
        brand_name: product.brandName,
        price_paisa: product.pricePaisa,
        compare_at_price_paisa: product.compareAtPricePaisa,
        cost_price_paisa: product.costPricePaisa,
        is_universal_fit: product.isUniversalFit,
        is_active: product.isActive,
        is_featured: product.isFeatured,
        stock_quantity: product.stockQuantity,
        weight_grams: product.weightGrams,
        dimensions_cm: product.dimensionsCm,
        installation_difficulty: product.installationDifficulty,
        warranty_months: product.warrantyMonths,
        images: product.images,
        specifications: product.specifications,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        return this.fallback.create(product);
      }

      return this.mapRowToProduct(data);
    } catch {
      return this.fallback.create(product);
    }
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isSupabaseConfigured) {
      return this.fallback.update(id, updates);
    }

    try {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.sku !== undefined) payload.sku = updates.sku;
      if (updates.barcode !== undefined) payload.barcode = updates.barcode;
      if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
      if (updates.categoryName !== undefined) payload.category_name = updates.categoryName;
      if (updates.brandId !== undefined) payload.brand_id = updates.brandId;
      if (updates.brandName !== undefined) payload.brand_name = updates.brandName;
      if (updates.pricePaisa !== undefined) payload.price_paisa = updates.pricePaisa;
      if (updates.compareAtPricePaisa !== undefined) payload.compare_at_price_paisa = updates.compareAtPricePaisa;
      if (updates.costPricePaisa !== undefined) payload.cost_price_paisa = updates.costPricePaisa;
      if (updates.isUniversalFit !== undefined) payload.is_universal_fit = updates.isUniversalFit;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
      if (updates.stockQuantity !== undefined) payload.stock_quantity = updates.stockQuantity;
      if (updates.weightGrams !== undefined) payload.weight_grams = updates.weightGrams;
      if (updates.dimensionsCm !== undefined) payload.dimensions_cm = updates.dimensionsCm;
      if (updates.installationDifficulty !== undefined) payload.installation_difficulty = updates.installationDifficulty;
      if (updates.warrantyMonths !== undefined) payload.warranty_months = updates.warrantyMonths;
      if (updates.images !== undefined) payload.images = updates.images;
      if (updates.specifications !== undefined) payload.specifications = updates.specifications;

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return this.fallback.update(id, updates);
      }

      return this.mapRowToProduct(data);
    } catch {
      return this.fallback.update(id, updates);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return this.fallback.delete(id);
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    } catch {
      return this.fallback.delete(id);
    }
  }

  private mapRowToProduct(row: Record<string, any>): Product {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      barcode: row.barcode,
      shortDescription: row.short_description || '',
      description: row.description || '',
      categoryId: row.category_id || '',
      categoryName: row.category_name,
      brandId: row.brand_id || '',
      brandName: row.brand_name,
      pricePaisa: Number(row.price_paisa) || 0,
      compareAtPricePaisa: row.compare_at_price_paisa ? Number(row.compare_at_price_paisa) : undefined,
      costPricePaisa: row.cost_price_paisa ? Number(row.cost_price_paisa) : undefined,
      isUniversalFit: Boolean(row.is_universal_fit),
      isActive: Boolean(row.is_active),
      isFeatured: Boolean(row.is_featured),
      weightGrams: row.weight_grams || 1000,
      dimensionsCm: row.dimensions_cm || '',
      installationDifficulty: row.installation_difficulty || 'Moderate',
      warrantyMonths: row.warranty_months ?? 12,
      specifications: Array.isArray(row.specifications) ? row.specifications : [],
      images: Array.isArray(row.images) ? row.images : [],
      stockQuantity: Number(row.stock_quantity) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ==============================================================================
// 2. CATEGORIES REPOSITORY
// ==============================================================================
export class SupabaseCategoryRepository implements ICategoryRepository {
  private fallback = new MockCategoryRepository();

  async getAll(): Promise<Category[]> {
    if (!isSupabaseConfigured) {
      return this.fallback.getAll();
    }

    if (cachedCategories && Date.now() < cachedCategories.expiry) {
      return cachedCategories.data;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.fallback.getAll();
      }

      const mapped: Category[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || '',
        imageUrl: row.image_url,
        isActive: Boolean(row.is_active),
        displayOrder: row.display_order || 0,
      }));

      cachedCategories = { data: mapped, expiry: Date.now() + TTL_FIVE_MINUTES_MS };
      return mapped;
    } catch {
      return this.fallback.getAll();
    }
  }

  async getBySlug(slug: string): Promise<Category | null> {
    if (!isSupabaseConfigured) {
      return this.fallback.getBySlug(slug);
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        return this.fallback.getBySlug(slug);
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        imageUrl: data.image_url,
        isActive: Boolean(data.is_active),
        displayOrder: data.display_order || 0,
      };
    } catch {
      return this.fallback.getBySlug(slug);
    }
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    if (!isSupabaseConfigured) {
      return this.fallback.create(category);
    }

    try {
      const id = `cat-${Date.now()}`;
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.imageUrl,
          is_active: category.isActive,
          display_order: category.displayOrder,
        })
        .select()
        .single();

      if (error || !data) return this.fallback.create(category);

      cachedCategories = null;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.image_url,
        isActive: data.is_active,
        displayOrder: data.display_order,
      };
    } catch {
      return this.fallback.create(category);
    }
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    if (!isSupabaseConfigured) {
      return this.fallback.update(id, updates);
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.description ? { description: updates.description } : {}),
          ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return this.fallback.update(id, updates);

      cachedCategories = null;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.image_url,
        isActive: data.is_active,
        displayOrder: data.display_order,
      };
    } catch {
      return this.fallback.update(id, updates);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return this.fallback.delete(id);
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) cachedCategories = null;
      return !error;
    } catch {
      return this.fallback.delete(id);
    }
  }
}

// ==============================================================================
// 3. BRANDS REPOSITORY (Canonical Single Brand: SHRELL)
// ==============================================================================
export const SHRELL_BRAND: Brand = {
  id: 'brand-shrell',
  name: 'SHRELL',
  slug: 'shrell',
  isActive: true,
  countryOfOrigin: 'India',
  logoUrl: '/logos/shrell-brandicon_no-bg.png',
};

export class SupabaseBrandRepository implements IBrandRepository {
  async getAll(): Promise<Brand[]> {
    return [SHRELL_BRAND];
  }

  async create(_brand: Omit<Brand, 'id'>): Promise<Brand> {
    return SHRELL_BRAND;
  }
}

// ==============================================================================
// 4. VEHICLES REPOSITORY
// ==============================================================================
export class SupabaseVehicleRepository implements IVehicleRepository {
  private fallback = new MockVehicleRepository();

  async getMakes(): Promise<VehicleMake[]> {
    if (!isSupabaseConfigured) return this.fallback.getMakes();
    try {
      const { data, error } = await supabase.from('vehicle_manufacturers').select('*');
      if (error || !data || data.length === 0) return this.fallback.getMakes();
      return data.map((m) => ({ id: m.id, name: m.name, slug: m.slug, country: m.country }));
    } catch {
      return this.fallback.getMakes();
    }
  }

  async getModelsByMake(makeId: string): Promise<VehicleModel[]> {
    if (!isSupabaseConfigured) return this.fallback.getModelsByMake(makeId);
    try {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select('*')
        .eq('make_id', makeId);
      if (error || !data || data.length === 0) return this.fallback.getModelsByMake(makeId);
      return data.map((m) => ({ id: m.id, makeId: m.make_id, name: m.name, slug: m.slug, bodyType: m.body_type }));
    } catch {
      return this.fallback.getModelsByMake(makeId);
    }
  }

  async getVariantsByModel(modelId: string): Promise<VehicleVariant[]> {
    if (!isSupabaseConfigured) return this.fallback.getVariantsByModel(modelId);
    try {
      const { data, error } = await supabase
        .from('vehicle_variants')
        .select('*')
        .eq('model_id', modelId);
      if (error || !data || data.length === 0) return this.fallback.getVariantsByModel(modelId);
      return data.map((v) => ({
        id: v.id,
        modelId: v.model_id,
        variantName: v.variant_name,
        yearStart: v.year_start,
        yearEnd: v.year_end,
      }));
    } catch {
      return this.fallback.getVariantsByModel(modelId);
    }
  }

  async getCompatibilityForProduct(productId: string): Promise<VehicleCompatibility[]> {
    if (!isSupabaseConfigured) return this.fallback.getCompatibilityForProduct(productId);
    try {
      const { data, error } = await supabase
        .from('product_compatibility')
        .select('*')
        .eq('product_id', productId);
      if (error || !data || data.length === 0) return this.fallback.getCompatibilityForProduct(productId);
      return data.map((c) => ({
        id: c.id,
        productId: c.product_id,
        modelId: c.model_id,
        variantId: c.variant_id,
        yearStart: c.year_start,
        yearEnd: c.year_end,
        notes: c.notes,
      }));
    } catch {
      return this.fallback.getCompatibilityForProduct(productId);
    }
  }

  async setProductCompatibility(productId: string, compatibilities: Omit<VehicleCompatibility, 'id'>[]): Promise<void> {
    if (!isSupabaseConfigured) return this.fallback.setProductCompatibility(productId, compatibilities);
    try {
      await supabase.from('product_compatibility').delete().eq('product_id', productId);
      if (compatibilities.length > 0) {
        const rows = compatibilities.map((c) => ({
          product_id: productId,
          model_id: c.modelId,
          variant_id: c.variantId || null,
          year_start: c.yearStart || null,
          year_end: c.yearEnd || null,
          notes: c.notes || null,
        }));
        await supabase.from('product_compatibility').insert(rows);
      }
    } catch {
      return this.fallback.setProductCompatibility(productId, compatibilities);
    }
  }
}

// ==============================================================================
// 5. INVENTORY REPOSITORY
// ==============================================================================
export class SupabaseInventoryRepository implements IInventoryRepository {
  private fallback = new MockInventoryRepository();

  async getStock(productId: string): Promise<{ onHand: number; reserved: number; available: number }> {
    if (!isSupabaseConfigured) return this.fallback.getStock(productId);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .maybeSingle();

      if (error || !data) return this.fallback.getStock(productId);

      const onHand = Number(data.stock_quantity) || 0;
      return { onHand, reserved: 0, available: onHand };
    } catch {
      return this.fallback.getStock(productId);
    }
  }

  async adjustStock(
    productId: string,
    quantityChange: number,
    movementType: InventoryMovement['movementType'],
    notes: string,
    referenceId: string
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      return this.fallback.adjustStock(productId, quantityChange, movementType, notes, referenceId);
    }

    try {
      // Record movement audit
      await supabase.from('inventory_movements').insert({
        product_id: productId,
        quantity_change: quantityChange,
        movement_type: movementType,
        reference_id: referenceId,
        notes,
      });

      // Update product stock quantity
      const { data: prod } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (prod) {
        const newQty = Math.max(0, (prod.stock_quantity || 0) + quantityChange);
        await supabase
          .from('products')
          .update({ stock_quantity: newQty })
          .eq('id', productId);
      }
    } catch (err) {
      console.warn('Supabase stock adjustment fallback:', err);
      return this.fallback.adjustStock(productId, quantityChange, movementType, notes, referenceId);
    }
  }

  async getMovements(productId?: string): Promise<InventoryMovement[]> {
    if (!isSupabaseConfigured) return this.fallback.getMovements(productId);
    try {
      let q = supabase
        .from('inventory_movements')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false });
      if (productId) q = q.eq('product_id', productId);
      const { data, error } = await q;
      if (error || !data) return this.fallback.getMovements(productId);
      return data.map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        productSku: m.products?.sku || m.product_sku || '',
        productName: m.products?.name || m.product_name || '',
        quantityChange: m.quantity_change,
        movementType: m.movement_type,
        referenceId: m.reference_id || '',
        notes: m.notes || '',
        createdAt: m.created_at,
      }));
    } catch {
      return this.fallback.getMovements(productId);
    }
  }
}

// ==============================================================================
// 6. ORDERS REPOSITORY
// ==============================================================================
export class SupabaseOrderRepository implements IOrderRepository {
  private fallback = new MockOrderRepository();

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    if (!isSupabaseConfigured) {
      return this.fallback.createOrder(order);
    }

    try {
      const orderId = `SH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderPayload = {
        id: orderId,
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        status: order.status,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod,
        payment_reference: order.paymentReference || null,
        subtotal_paisa: order.subtotalPaisa,
        tax_paisa: order.taxPaisa,
        shipping_paisa: order.shippingPaisa,
        discount_paisa: order.discountPaisa,
        total_paisa: order.totalPaisa,
        currency: 'INR',
        shipping_address: order.shippingAddress,
        delivery_instructions: order.deliveryInstructions || null,
        idempotency_key: order.idempotencyKey,
      };

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError || !createdOrder) {
        console.warn('Supabase order insert error, fallback:', orderError);
        return this.fallback.createOrder(order);
      }

      // Insert Order Items
      if (order.items && order.items.length > 0) {
        const itemRows = order.items.map((it) => ({
          order_id: orderId,
          product_id: it.productId,
          product_name: it.productName,
          sku: it.sku,
          unit_price_paisa: it.unitPricePaisa,
          quantity: it.quantity,
          subtotal_paisa: it.subtotalPaisa,
          image_url: it.imageUrl || null,
        }));

        await supabase.from('order_items').insert(itemRows);

        // Record stock movements for each item
        for (const it of order.items) {
          try {
            await supabase
              .from('inventory_movements')
              .insert({
                product_id: it.productId,
                quantity_change: -it.quantity,
                movement_type: 'SALE',
                reference_id: orderId,
                notes: `Order checkout ${orderId}`,
              });
          } catch (_) {}
        }
      }

      return this.mapRowToOrder(createdOrder, order.items);
    } catch (err) {
      console.warn('Order creation exception, falling back to local storage:', err);
      return this.fallback.createOrder(order);
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (!isSupabaseConfigured) {
      return this.fallback.getOrderById(id);
    }

    try {
      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (orderErr || !orderRow) {
        return this.fallback.getOrderById(id);
      }

      const { data: itemsRows } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      const items = (itemsRows || []).map((it) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productName: it.product_name,
        sku: it.sku,
        unitPricePaisa: Number(it.unit_price_paisa),
        quantity: it.quantity,
        subtotalPaisa: Number(it.subtotal_paisa),
        imageUrl: it.image_url,
      }));

      return this.mapRowToOrder(orderRow, items);
    } catch {
      return this.fallback.getOrderById(id);
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return this.fallback.getOrdersByCustomer(customerId);
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return this.fallback.getOrdersByCustomer(customerId);
      }

      return data.map((r) => this.mapRowToOrder(r, []));
    } catch {
      return this.fallback.getOrdersByCustomer(customerId);
    }
  }

  async getAllOrders(filters?: { status?: string; paymentStatus?: string; search?: string }): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return this.fallback.getAllOrders(filters);
    }

    try {
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.paymentStatus) q = q.eq('payment_status', filters.paymentStatus);
      if (filters?.search) {
        q = q.or(`id.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await q;
      if (error || !data) {
        return this.fallback.getAllOrders(filters);
      }

      return data.map((r) => this.mapRowToOrder(r, []));
    } catch {
      return this.fallback.getAllOrders(filters);
    }
  }

  async updateOrderStatus(id: string, status: Order['status'], internalNotes?: string): Promise<Order> {
    if (!isSupabaseConfigured) {
      return this.fallback.updateOrderStatus(id, status, internalNotes);
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, ...(internalNotes ? { internal_notes: internalNotes } : {}) })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return this.fallback.updateOrderStatus(id, status, internalNotes);
      return this.mapRowToOrder(data, []);
    } catch {
      return this.fallback.updateOrderStatus(id, status, internalNotes);
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus'], reference?: string): Promise<Order> {
    if (!isSupabaseConfigured) {
      return this.fallback.updatePaymentStatus(id, paymentStatus, reference);
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          ...(reference ? { payment_reference: reference } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return this.fallback.updatePaymentStatus(id, paymentStatus, reference);
      return this.mapRowToOrder(data, []);
    } catch {
      return this.fallback.updatePaymentStatus(id, paymentStatus, reference);
    }
  }

  async updateShipment(orderId: string, shipment: Order['shipment']): Promise<Order> {
    if (!isSupabaseConfigured) {
      return this.fallback.updateShipment(orderId, shipment);
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ shipment })
        .eq('id', orderId)
        .select()
        .single();

      if (error || !data) return this.fallback.updateShipment(orderId, shipment);
      return this.mapRowToOrder(data, []);
    } catch {
      return this.fallback.updateShipment(orderId, shipment);
    }
  }

  private mapRowToOrder(row: Record<string, any>, items: Order['items']): Order {
    return {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      subtotalPaisa: Number(row.subtotal_paisa),
      taxPaisa: Number(row.tax_paisa),
      shippingPaisa: Number(row.shipping_paisa),
      discountPaisa: Number(row.discount_paisa),
      totalPaisa: Number(row.total_paisa),
      shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address,
      deliveryInstructions: row.delivery_instructions,
      shipment: row.shipment,
      items: items || [],
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ==============================================================================
// 7. COUPONS REPOSITORY
// ==============================================================================
export class SupabaseCouponRepository implements ICouponRepository {
  private fallback = new MockCouponRepository();

  async getByCode(code: string): Promise<Coupon | null> {
    if (!isSupabaseConfigured) {
      return this.fallback.getByCode(code);
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return this.fallback.getByCode(code);

      return {
        id: data.id,
        code: data.code,
        discountType: data.discount_type,
        discountValue: data.discount_value,
        minOrderPaisa: data.min_order_paisa ? Number(data.min_order_paisa) : 0,
        maxDiscountPaisa: data.max_discount_paisa ? Number(data.max_discount_paisa) : undefined,
        maxUses: data.max_uses,
        usedCount: data.used_count || 0,
        validFrom: data.valid_from,
        validUntil: data.valid_until,
        isActive: Boolean(data.is_active),
      };
    } catch {
      return this.fallback.getByCode(code);
    }
  }

  async getAll(): Promise<Coupon[]> {
    if (!isSupabaseConfigured) return this.fallback.getAll();
    try {
      const { data, error } = await supabase.from('coupons').select('*');
      if (error || !data) return this.fallback.getAll();
      return data.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discount_type,
        discountValue: c.discount_value,
        minOrderPaisa: c.min_order_paisa ? Number(c.min_order_paisa) : 0,
        maxDiscountPaisa: c.max_discount_paisa ? Number(c.max_discount_paisa) : undefined,
        maxUses: c.max_uses,
        usedCount: c.used_count || 0,
        validFrom: c.valid_from,
        validUntil: c.valid_until,
        isActive: Boolean(c.is_active),
      }));
    } catch {
      return this.fallback.getAll();
    }
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return this.getAll();
  }

  async create(coupon: Omit<Coupon, 'id' | 'usedCount'>): Promise<Coupon> {
    if (!isSupabaseConfigured) return this.fallback.create(coupon);
    try {
      const id = `coup-${Date.now()}`;
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          id,
          code: coupon.code.toUpperCase(),
          discount_type: coupon.discountType,
          discount_value: coupon.discountValue,
          min_order_paisa: coupon.minOrderPaisa,
          max_discount_paisa: coupon.maxDiscountPaisa,
          max_uses: coupon.maxUses,
          used_count: 0,
          is_active: coupon.isActive,
        })
        .select()
        .single();

      if (error || !data) return this.fallback.create(coupon);
      return {
        id: data.id,
        code: data.code,
        discountType: data.discount_type,
        discountValue: data.discount_value,
        minOrderPaisa: data.min_order_paisa,
        maxDiscountPaisa: data.max_discount_paisa,
        maxUses: data.max_uses,
        usedCount: 0,
        validFrom: data.valid_from,
        validUntil: data.valid_until,
        isActive: data.is_active,
      };
    } catch {
      return this.fallback.create(coupon);
    }
  }

  async incrementUsage(code: string): Promise<void> {
    if (!isSupabaseConfigured) return this.fallback.incrementUsage(code);
    try {
      const { data: coup } = await supabase
        .from('coupons')
        .select('used_count')
        .ilike('code', code.trim())
        .single();
      if (coup) {
        await supabase
          .from('coupons')
          .update({ used_count: (coup.used_count || 0) + 1 })
          .ilike('code', code.trim());
      }
    } catch {
      return this.fallback.incrementUsage(code);
    }
  }
}

// ==============================================================================
// 8. STORE SETTINGS REPOSITORY
// ==============================================================================
export class SupabaseSettingsRepository implements ISettingsRepository {
  private fallback = new MockSettingsRepository();

  async getSettings(): Promise<StoreSettings> {
    if (!isSupabaseConfigured) return this.fallback.getSettings();

    if (cachedSettings && Date.now() < cachedSettings.expiry) {
      return cachedSettings.data;
    }

    try {
      const { data, error } = await supabase.from('store_settings').select('*');
      if (error || !data || data.length === 0) return this.fallback.getSettings();

      const settingsMap: Record<string, any> = {};
      for (const row of data) {
        settingsMap[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      }

      const storeInfo = settingsMap.store_info || {};
      const shippingRules = settingsMap.shipping_rules || {};
      const seoOpengraph = settingsMap.seo_opengraph || {};

      const result: StoreSettings = {
        storeName: storeInfo.storeName || 'SHRELL Automotive',
        contactEmail: storeInfo.contactEmail || 'orders@shrell.com',
        contactPhone: storeInfo.contactPhone || '+91 98765 43210',
        whatsappSupportNumber: storeInfo.whatsappSupportNumber || '919876543210',
        storeUpiId: storeInfo.storeUpiId || '',
        storeUpiName: storeInfo.storeUpiName || '',
        freeShippingThresholdPaisa: shippingRules.freeShippingThresholdPaisa || 30000,
        standardShippingPaisa: shippingRules.standardShippingPaisa || 6000,
        gstRatePercent: shippingRules.gstRatePercent || 18,
        currency: 'INR',
        ogTitle: seoOpengraph.ogTitle || 'SHRELL Automotive | Premium Car Accessories in India',
        ogDescription:
          seoOpengraph.ogDescription ||
          'Shop premium car accessories and touring equipment for Indian vehicles. OSRAM auxiliary lighting, aerodynamic crossbars, 7D floor liners, and heavy-duty 12V tyre inflators.',
        ogImageUrl: seoOpengraph.ogImageUrl || '/shrell-opengraph.png',
        ogImageAlt:
          seoOpengraph.ogImageAlt ||
          'SHRELL Automotive - Premium Car Accessories & Touring Equipment',
      };

      cachedSettings = { data: result, expiry: Date.now() + TTL_FIVE_MINUTES_MS };
      return result;
    } catch {
      return this.fallback.getSettings();
    }
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    if (!isSupabaseConfigured) return this.fallback.updateSettings(settings);
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };

      const { error } = await supabase.from('store_settings').upsert([
        {
          key: 'store_info',
          value: {
            storeName: updated.storeName,
            contactEmail: updated.contactEmail,
            contactPhone: updated.contactPhone,
            whatsappSupportNumber: updated.whatsappSupportNumber,
            storeUpiId: updated.storeUpiId,
            storeUpiName: updated.storeUpiName,
          },
        },
        {
          key: 'shipping_rules',
          value: {
            freeShippingThresholdPaisa: updated.freeShippingThresholdPaisa,
            standardShippingPaisa: updated.standardShippingPaisa,
            gstRatePercent: updated.gstRatePercent,
          },
        },
        {
          key: 'seo_opengraph',
          value: {
            ogTitle: updated.ogTitle || 'SHRELL Automotive | Premium Car Accessories in India',
            ogDescription:
              updated.ogDescription ||
              'Shop premium car accessories and touring equipment for Indian vehicles. OSRAM auxiliary lighting, aerodynamic crossbars, 7D floor liners, and heavy-duty 12V tyre inflators.',
            ogImageUrl: updated.ogImageUrl || '/shrell-opengraph.png',
            ogImageAlt:
              updated.ogImageAlt ||
              'SHRELL Automotive - Premium Car Accessories & Touring Equipment',
          },
        },
      ]);

      if (error) {
        return this.fallback.updateSettings(settings);
      }

      cachedSettings = null;
      await this.fallback.updateSettings(updated);
      return updated;
    } catch {
      return this.fallback.updateSettings(settings);
    }
  }
}

// ==============================================================================
// 9. HOME SECTIONS CMS REPOSITORY
// ==============================================================================
export class SupabaseHomeSectionRepository implements IHomeSectionRepository {
  private fallback = new MockHomeSectionRepository();

  private mapRowToSection(row: Record<string, any>): HomeSection {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle || undefined,
      sectionType: row.section_type,
      displayOrder: row.display_order ?? 0,
      isActive: Boolean(row.is_active),
      categorySlug: row.category_slug || undefined,
      limit: row.item_limit ?? 4,
      viewAllUrl: row.view_all_url || undefined,
      customBannerUrl: row.custom_banner_url || undefined,
      customBannerTargetUrl: row.custom_banner_target_url || undefined,
      bentoConfig: row.bento_config ? (typeof row.bento_config === 'string' ? JSON.parse(row.bento_config) : row.bento_config) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAll(): Promise<HomeSection[]> {
    if (!isSupabaseConfigured) return this.fallback.getAll();

    if (cachedHomeSections && Date.now() < cachedHomeSections.expiry) {
      return cachedHomeSections.data;
    }

    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data) {
        return this.fallback.getAll();
      }

      const mapped = data.map((r) => this.mapRowToSection(r));
      cachedHomeSections = { data: mapped, expiry: Date.now() + TTL_FIVE_MINUTES_MS };
      return mapped;
    } catch {
      return this.fallback.getAll();
    }
  }

  async getById(id: string): Promise<HomeSection | null> {
    if (!isSupabaseConfigured) return this.fallback.getById(id);
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return this.fallback.getById(id);
      return this.mapRowToSection(data);
    } catch {
      return this.fallback.getById(id);
    }
  }

  async create(section: Omit<HomeSection, 'id' | 'createdAt' | 'updatedAt'>): Promise<HomeSection> {
    if (!isSupabaseConfigured) return this.fallback.create(section);
    try {
      const id = `sec-${Date.now()}`;
      const payload = {
        id,
        title: section.title,
        subtitle: section.subtitle || null,
        section_type: section.sectionType,
        display_order: section.displayOrder,
        is_active: section.isActive,
        category_slug: section.categorySlug || null,
        item_limit: section.limit ?? 4,
        view_all_url: section.viewAllUrl || null,
        custom_banner_url: section.customBannerUrl || null,
        custom_banner_target_url: section.customBannerTargetUrl || null,
        bento_config: section.bentoConfig || null,
      };

      const { data, error } = await supabase
        .from('home_sections')
        .insert(payload)
        .select()
        .single();

      if (error || !data) return this.fallback.create(section);
      cachedHomeSections = null;
      return this.mapRowToSection(data);
    } catch {
      return this.fallback.create(section);
    }
  }

  async update(id: string, updates: Partial<HomeSection>): Promise<HomeSection> {
    if (!isSupabaseConfigured) return this.fallback.update(id, updates);
    try {
      const payload: Record<string, any> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle;
      if (updates.sectionType !== undefined) payload.section_type = updates.sectionType;
      if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.categorySlug !== undefined) payload.category_slug = updates.categorySlug;
      if (updates.limit !== undefined) payload.item_limit = updates.limit;
      if (updates.viewAllUrl !== undefined) payload.view_all_url = updates.viewAllUrl;
      if (updates.customBannerUrl !== undefined) payload.custom_banner_url = updates.customBannerUrl;
      if (updates.customBannerTargetUrl !== undefined) payload.custom_banner_target_url = updates.customBannerTargetUrl;
      if (updates.bentoConfig !== undefined) payload.bento_config = updates.bentoConfig;

      const { data, error } = await supabase
        .from('home_sections')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return this.fallback.update(id, updates);
      cachedHomeSections = null;
      return this.mapRowToSection(data);
    } catch {
      return this.fallback.update(id, updates);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return this.fallback.delete(id);
    try {
      const { error } = await supabase.from('home_sections').delete().eq('id', id);
      if (error) return this.fallback.delete(id);
      cachedHomeSections = null;
      return true;
    } catch {
      return this.fallback.delete(id);
    }
  }

  async reorder(sectionIds: string[]): Promise<void> {
    if (!isSupabaseConfigured) return this.fallback.reorder(sectionIds);
    try {
      for (let i = 0; i < sectionIds.length; i++) {
        await supabase
          .from('home_sections')
          .update({ display_order: i + 1 })
          .eq('id', sectionIds[i]);
      }
      cachedHomeSections = null;
    } catch {
      return this.fallback.reorder(sectionIds);
    }
  }
}

// ==============================================================================
// 12. REVIEWS & RATINGS REPOSITORY
// ==============================================================================
export class SupabaseReviewRepository implements IReviewRepository {
  private fallback = new MockReviewRepository();

  private mapReviewRow = (r: any): ProductReview => ({
    id: r.id,
    productId: r.product_id,
    customerId: r.customer_id,
    authorName: r.author_name,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    isVerifiedPurchase: r.is_verified_purchase ?? true,
    createdAt: r.created_at,
  });

  async getAllReviews(): Promise<ProductReview[]> {
    if (!isSupabaseConfigured) return this.fallback.getAllReviews();
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.fallback.getAllReviews();
      }

      return (data || []).map(this.mapReviewRow);
    } catch {
      return this.fallback.getAllReviews();
    }
  }

  async getByProductId(productId: string): Promise<ProductReview[]> {
    if (!isSupabaseConfigured) return this.fallback.getByProductId(productId);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.fallback.getByProductId(productId);
      }

      return (data || []).map(this.mapReviewRow);
    } catch {
      return this.fallback.getByProductId(productId);
    }
  }

  async addReview(review: Omit<ProductReview, 'id' | 'createdAt'>): Promise<ProductReview> {
    if (!isSupabaseConfigured) return this.fallback.addReview(review);
    try {
      const newId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from('product_reviews')
        .insert([
          {
            id: newId,
            product_id: review.productId,
            customer_id: review.customerId || null,
            author_name: review.authorName,
            rating: review.rating,
            title: review.title || null,
            comment: review.comment,
            is_verified_purchase: review.isVerifiedPurchase ?? true,
            is_approved: true,
          },
        ])
        .select()
        .single();

      if (error || !data) {
        return this.fallback.addReview(review);
      }

      return this.mapReviewRow(data);
    } catch {
      return this.fallback.addReview(review);
    }
  }

  async deleteReview(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return this.fallback.deleteReview(id);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase review delete failed:', error);
        return false;
      }

      // Also keep local fallback cache synced if this ID existed there
      await this.fallback.deleteReview(id);
      return true;
    } catch (err) {
      console.error('Review delete exception:', err);
      return false;
    }
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
