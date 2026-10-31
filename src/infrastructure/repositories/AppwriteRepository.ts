import { ID, Query } from 'appwrite';
import {
  Category,
  Order,
  Product,
  StoreSettings,
} from '../../domain/types';
import {
  COLLECTIONS,
  databaseId,
  databases,
  isAppwriteConfigured,
} from '../appwrite/client';
import {
  ICategoryRepository,
  IOrderRepository,
  IProductRepository,
  ISettingsRepository,
  ProductFilterParams,
} from './types';
import {
  MockCategoryRepository,
  MockOrderRepository,
  MockProductRepository,
  MockSettingsRepository,
} from './MockPersistenceRepository';

export class AppwriteProductRepository implements IProductRepository {
  private fallback = new MockProductRepository();

  async getAll(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    if (!isAppwriteConfigured) {
      return this.fallback.getAll(params);
    }

    try {
      const queries: string[] = [Query.equal('is_active', true)];

      if (params?.categorySlug) {
        queries.push(Query.equal('category_slug', params.categorySlug));
      }
      if (params?.brandSlug) {
        queries.push(Query.equal('brand_slug', params.brandSlug));
      }
      if (params?.search) {
        queries.push(Query.search('name', params.search));
      }
      if (params?.sort === 'price_asc') {
        queries.push(Query.orderAsc('price'));
      } else if (params?.sort === 'price_desc') {
        queries.push(Query.orderDesc('price'));
      } else {
        queries.push(Query.orderDesc('$createdAt'));
      }

      const limit = params?.limit || 20;
      const page = params?.page || 1;
      queries.push(Query.limit(limit));
      queries.push(Query.offset((page - 1) * limit));

      const res = await databases.listDocuments(databaseId, COLLECTIONS.PRODUCTS, queries);
      const products: Product[] = res.documents.map((doc) => this.mapDocToProduct(doc));
      return { products, total: res.total };
    } catch (err) {
      console.warn('Appwrite query failed, using local repository:', err);
      return this.fallback.getAll(params);
    }
  }

  async getBySlug(slug: string): Promise<Product | null> {
    if (!isAppwriteConfigured) {
      return this.fallback.getBySlug(slug);
    }
    try {
      const res = await databases.listDocuments(databaseId, COLLECTIONS.PRODUCTS, [
        Query.equal('slug', slug),
        Query.limit(1),
      ]);
      if (res.documents.length === 0) return null;
      return this.mapDocToProduct(res.documents[0]);
    } catch {
      return this.fallback.getBySlug(slug);
    }
  }

  async getById(id: string): Promise<Product | null> {
    if (!isAppwriteConfigured) {
      return this.fallback.getById(id);
    }
    try {
      const doc = await databases.getDocument(databaseId, COLLECTIONS.PRODUCTS, id);
      return this.mapDocToProduct(doc);
    } catch {
      return this.fallback.getById(id);
    }
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (!isAppwriteConfigured) {
      return this.fallback.create(product);
    }
    try {
      const doc = await databases.createDocument(
        databaseId,
        COLLECTIONS.PRODUCTS,
        ID.unique(),
        {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.pricePaisa,
          compare_at_price: product.compareAtPricePaisa || 0,
          cost_price: product.costPricePaisa || 0,
          short_description: product.shortDescription,
          description: product.description,
          category_id: product.categoryId,
          brand_id: product.brandId,
          is_universal_fit: product.isUniversalFit,
          is_active: product.isActive,
          is_featured: product.isFeatured,
          weight_grams: product.weightGrams,
          dimensions_cm: product.dimensionsCm,
          installation_difficulty: product.installationDifficulty,
          warranty_months: product.warrantyMonths,
          stock_quantity: product.stockQuantity,
          images_json: JSON.stringify(product.images),
          specs_json: JSON.stringify(product.specifications),
        }
      );
      return this.mapDocToProduct(doc);
    } catch {
      return this.fallback.create(product);
    }
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isAppwriteConfigured) {
      return this.fallback.update(id, updates);
    }
    try {
      const doc = await databases.updateDocument(databaseId, COLLECTIONS.PRODUCTS, id, {
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.pricePaisa ? { price: updates.pricePaisa } : {}),
        ...(updates.stockQuantity !== undefined ? { stock_quantity: updates.stockQuantity } : {}),
      });
      return this.mapDocToProduct(doc);
    } catch {
      return this.fallback.update(id, updates);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!isAppwriteConfigured) {
      return this.fallback.delete(id);
    }
    try {
      await databases.deleteDocument(databaseId, COLLECTIONS.PRODUCTS, id);
      return true;
    } catch {
      return this.fallback.delete(id);
    }
  }

  private mapDocToProduct(doc: Record<string, any>): Product {
    let images = [];
    let specifications = [];
    try {
      images = doc.images_json ? JSON.parse(doc.images_json) : [];
      specifications = doc.specs_json ? JSON.parse(doc.specs_json) : [];
    } catch {}

    return {
      id: doc.$id,
      name: doc.name,
      slug: doc.slug,
      sku: doc.sku,
      barcode: doc.barcode,
      shortDescription: doc.short_description || '',
      description: doc.description || '',
      categoryId: doc.category_id || '',
      categoryName: doc.category_name,
      brandId: doc.brand_id || '',
      brandName: doc.brand_name,
      pricePaisa: doc.price || 0,
      compareAtPricePaisa: doc.compare_at_price,
      costPricePaisa: doc.cost_price,
      isUniversalFit: Boolean(doc.is_universal_fit),
      isActive: Boolean(doc.is_active),
      isFeatured: Boolean(doc.is_featured),
      weightGrams: doc.weight_grams || 1000,
      dimensionsCm: doc.dimensions_cm || '',
      installationDifficulty: doc.installation_difficulty || 'Moderate',
      warrantyMonths: doc.warranty_months || 12,
      specifications,
      images,
      stockQuantity: doc.stock_quantity || 0,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    };
  }
}

export class AppwriteCategoryRepository implements ICategoryRepository {
  private fallback = new MockCategoryRepository();

  async getAll(): Promise<Category[]> {
    return this.fallback.getAll();
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return this.fallback.getBySlug(slug);
  }

  async create(cat: Omit<Category, 'id'>): Promise<Category> {
    return this.fallback.create(cat);
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    return this.fallback.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.fallback.delete(id);
  }
}

export class AppwriteOrderRepository implements IOrderRepository {
  private fallback = new MockOrderRepository();

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return this.fallback.createOrder(order);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.fallback.getOrderById(id);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.fallback.getOrdersByCustomer(customerId);
  }

  async getAllOrders(filters?: { status?: string; paymentStatus?: string; search?: string }): Promise<Order[]> {
    return this.fallback.getAllOrders(filters);
  }

  async updateOrderStatus(id: string, status: Order['status'], internalNotes?: string): Promise<Order> {
    return this.fallback.updateOrderStatus(id, status, internalNotes);
  }

  async updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus'], reference?: string): Promise<Order> {
    return this.fallback.updatePaymentStatus(id, paymentStatus, reference);
  }

  async updateShipment(orderId: string, shipment: Order['shipment']): Promise<Order> {
    return this.fallback.updateShipment(orderId, shipment);
  }
}

export class AppwriteSettingsRepository implements ISettingsRepository {
  private fallback = new MockSettingsRepository();

  async getSettings(): Promise<StoreSettings> {
    return this.fallback.getSettings();
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    return this.fallback.updateSettings(settings);
  }
}
