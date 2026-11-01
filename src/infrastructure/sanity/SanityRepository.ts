/**
 * Sanity Repository Adapter
 * Maps Sanity CMS documents into SHRELL Automotive domain models,
 * providing a seamless bridge between Sanity Headless CMS and the storefront.
 */

import { Product, HeroBanner } from '../../domain/types';
import { IProductRepository, ProductFilterParams } from '../repositories/types';
import { fetchSanityProducts, fetchSanityBanners } from './sanityClient';
import { isSanityConfigured } from './sanityConfig';
import { MockProductRepository } from '../repositories/MockPersistenceRepository';

const fallbackProductRepo = new MockProductRepository();

export class SanityProductRepository implements IProductRepository {
  private mapSanityDocToProduct(doc: any): Product {
    const rawPrice = Number(doc.price) || 0;
    // Normalize price: if entered in rupees (e.g. 2999), convert to integer paisa (299900)
    const pricePaisa = rawPrice < 50000 ? Math.round(rawPrice * 100) : rawPrice;
    const rawCompare = Number(doc.salePrice || doc.compareAtPrice) || 0;
    const compareAtPricePaisa = rawCompare > 0
      ? (rawCompare < 50000 ? Math.round(rawCompare * 100) : rawCompare)
      : undefined;

    const images = Array.isArray(doc.images)
      ? doc.images.map((img: any, idx: number) => ({
          id: `img-${doc._id}-${idx}`,
          productId: doc._id,
          url: typeof img === 'string' ? img : img.url || '',
          altText: img.alt || doc.name || 'SHRELL Equipment',
          sortOrder: idx + 1,
          isPrimary: idx === 0,
        }))
      : [];

    return {
      id: doc._id,
      name: doc.name || 'SHRELL Equipment',
      slug: doc.slug || doc._id,
      sku: doc.sku || `SHR-${doc._id.slice(0, 6).toUpperCase()}`,
      shortDescription: doc.shortDescription || doc.description?.slice(0, 120) || 'Premium automotive equipment.',
      description: doc.description || '',
      categoryId: doc.category || 'all',
      categoryName: doc.categoryName || doc.category || 'Automotive Gear',
      brandId: 'brand-shrell',
      brandName: doc.brand || 'SHRELL OEM',
      pricePaisa,
      compareAtPricePaisa,
      isUniversalFit: doc.isUniversalFit ?? true,
      isActive: doc.isActive ?? true,
      isFeatured: doc.isFeatured ?? true,
      weightGrams: doc.weightGrams || 1500,
      dimensionsCm: doc.dimensionsCm || '30x20x10',
      installationDifficulty: doc.installationDifficulty || 'Moderate',
      warrantyMonths: doc.warrantyMonths || 12,
      specifications: Array.isArray(doc.specifications) ? doc.specifications : [],
      images,
      stockQuantity: doc.inStock === false ? 0 : (doc.stockQuantity || 50),
      createdAt: doc._createdAt || new Date().toISOString(),
      updatedAt: doc._updatedAt || new Date().toISOString(),
    };
  }

  async getAll(params?: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    try {
      if (isSanityConfigured()) {
        const docs = await fetchSanityProducts();
        if (docs && docs.length > 0) {
          let products: Product[] = docs.map((d: any) => this.mapSanityDocToProduct(d));

          // Filter by category
          if (params?.categorySlug && params.categorySlug !== 'all') {
            products = products.filter(
              (p: Product) =>
                p.categoryId.toLowerCase().includes(params.categorySlug!.toLowerCase()) ||
                (p.categoryName && p.categoryName.toLowerCase().includes(params.categorySlug!.toLowerCase()))
            );
          }

          // Filter by search
          if (params?.search) {
            const q = params.search.toLowerCase();
            products = products.filter(
              (p: Product) =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q)
            );
          }

          return {
            products,
            total: products.length,
          };
        }
      }
    } catch (err) {
      console.warn('Error reading from Sanity products, using local fallback:', err);
    }

    // Seamless fallback to existing products
    return fallbackProductRepo.getAll(params);
  }

  async getById(id: string): Promise<Product | null> {
    const list = await this.getAll();
    return list.products.find((p: Product) => p.id === id) || fallbackProductRepo.getById(id);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const list = await this.getAll();
    return list.products.find((p: Product) => p.slug === slug) || fallbackProductRepo.getBySlug(slug);
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return fallbackProductRepo.create(product);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    return fallbackProductRepo.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return fallbackProductRepo.delete(id);
  }

  async getFeatured(): Promise<Product[]> {
    const res = await this.getAll();
    return res.products.filter((p: Product) => p.isFeatured);
  }
}

export class SanityBannerRepository {
  async getAll(): Promise<HeroBanner[]> {
    try {
      if (isSanityConfigured()) {
        const docs = await fetchSanityBanners();
        if (docs && docs.length > 0) {
          return docs.map((d: any, idx: number) => ({
            id: d._id,
            desktopImageUrl: d.desktopImageUrl,
            mobileImageUrl: d.mobileImageUrl || d.desktopImageUrl,
            targetUrl: d.targetUrl || '/catalogue',
            altText: d.altText || d.title || 'SHRELL Banner',
            isActive: d.isActive !== false,
            order: d.order || idx + 1,
            createdAt: d._createdAt || new Date().toISOString(),
          }));
        }
      }
    } catch (err) {
      console.warn('Error reading Sanity banners:', err);
    }
    return [];
  }
}

export const sanityProductRepository = new SanityProductRepository();
export const sanityBannerRepository = new SanityBannerRepository();
