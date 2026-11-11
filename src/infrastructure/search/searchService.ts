import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Product } from '../../domain/types.ts';

/**
 * Fuse.js configuration tuned for automotive e-commerce search.
 * Typo tolerance: 'matts' -> 'Floor Mats', 'difuser' -> 'Diffuser', 'cabl' -> 'Cable'
 */
export const PRODUCT_FUSE_OPTIONS: IFuseOptions<Product> = {
  keys: [
    { name: 'name', weight: 0.55 },
    { name: 'categoryName', weight: 0.2 },
    { name: 'brandName', weight: 0.15 },
    { name: 'shortDescription', weight: 0.05 },
    { name: 'sku', weight: 0.05 },
  ],
  threshold: 0.42, // Typo tolerant (matches 1-2 character transpositions/misspellings)
  distance: 120,
  minMatchCharLength: 2,
  includeScore: true,
  shouldSort: true,
  ignoreLocation: true,
  useExtendedSearch: false,
};

let cachedFuse: Fuse<Product> | null = null;
let cachedCollectionHash = '';

/**
 * Creates or reuses a memoized Fuse index for a product collection.
 */
export function getProductFuse(products: Product[]): Fuse<Product> {
  // Simple fast identity check to invalidate cache when product list changes
  const currentHash = `${products.length}:${products[0]?.id || ''}:${products[products.length - 1]?.id || ''}`;
  if (!cachedFuse || cachedCollectionHash !== currentHash) {
    cachedFuse = new Fuse(products, PRODUCT_FUSE_OPTIONS);
    cachedCollectionHash = currentHash;
  }
  return cachedFuse;
}

/**
 * Performs fast, typo-tolerant fuzzy search on products.
 * Returns raw items when query is empty.
 */
export function searchProductsWithFuse(
  products: Product[],
  query: string,
  options?: { limit?: number; categorySlug?: string }
): Product[] {
  const cleanQuery = query.trim();

  let pool = products;
  if (options?.categorySlug) {
    pool = pool.filter(
      (p) =>
        p.categoryId === options.categorySlug ||
        p.categoryName?.toLowerCase().includes(options.categorySlug!.toLowerCase())
    );
  }

  if (!cleanQuery) {
    return options?.limit ? pool.slice(0, options.limit) : pool;
  }

  const fuse = getProductFuse(pool);
  const searchResults = fuse.search(cleanQuery, options?.limit ? { limit: options.limit } : undefined);

  return searchResults.map((result) => result.item);
}
