/**
 * Sanity CMS Client Service
 * Provides authenticated/unauthenticated GROQ querying, image URL transforms,
 * asset uploads, and connectivity verification with resilient fallbacks.
 */

import { createClient, SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { getSanityConfig, isSanityConfigured } from './sanityConfig';

let cachedClient: SanityClient | null = null;
let lastProjectId = '';
let lastDataset = '';
let lastToken = '';

/**
 * Get or initialize the Sanity client with current active configuration.
 */
export function getSanityClient(): SanityClient | null {
  const config = getSanityConfig();
  if (!config.projectId) {
    return null;
  }

  // Re-instantiate if credentials changed
  if (
    !cachedClient ||
    lastProjectId !== config.projectId ||
    lastDataset !== config.dataset ||
    lastToken !== (config.token || '')
  ) {
    cachedClient = createClient({
      projectId: config.projectId,
      dataset: config.dataset || 'production',
      apiVersion: config.apiVersion || '2024-01-01',
      useCdn: config.useCdn,
      token: config.token || undefined,
    });
    lastProjectId = config.projectId;
    lastDataset = config.dataset;
    lastToken = config.token || '';
  }

  return cachedClient;
}

/**
 * Image URL builder for Sanity image references.
 */
export function urlFor(source: any): string {
  const client = getSanityClient();
  if (!client || !source) {
    return typeof source === 'string' ? source : '';
  }

  try {
    const builder = imageUrlBuilder(client);
    return builder.image(source).auto('format').fit('max').url();
  } catch (err) {
    console.warn('Failed to build Sanity image URL:', err);
    return typeof source === 'string' ? source : '';
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  productCount?: number;
  categoryCount?: number;
  bannerCount?: number;
  error?: string;
}

/**
 * Verify live connection to Sanity CMS project and dataset.
 */
export async function testSanityConnection(): Promise<ConnectionTestResult> {
  const config = getSanityConfig();
  if (!config.projectId) {
    return {
      success: false,
      message: 'No Sanity Project ID configured.',
      error: 'Please enter your Sanity Project ID in Settings.',
    };
  }

  const client = getSanityClient();
  if (!client) {
    return {
      success: false,
      message: 'Failed to initialize Sanity client.',
      error: 'Client could not be constructed with current configuration.',
    };
  }

  const startTime = Date.now();
  try {
    // Run lightweight query to check connection and count documents
    const counts = await client.fetch<{
      products: number;
      categories: number;
      banners: number;
    }>(
      `{
        "products": count(*[_type == "product"]),
        "categories": count(*[_type == "category"]),
        "banners": count(*[_type in ["banner", "heroBanner"]])
      }`
    );

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: `Successfully connected to Sanity project "${config.projectId}" (${config.dataset}) in ${latencyMs}ms!`,
      latencyMs,
      productCount: counts.products || 0,
      categoryCount: counts.categories || 0,
      bannerCount: counts.banners || 0,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err?.message || String(err);
    return {
      success: false,
      message: 'Connection to Sanity failed.',
      latencyMs,
      error: errorMsg,
    };
  }
}

/**
 * Query products from Sanity CMS with fallback.
 */
export async function fetchSanityProducts(): Promise<any[]> {
  const client = getSanityClient();
  if (!client || !isSanityConfigured()) {
    return [];
  }

  try {
    const query = `*[_type == "product"] | order(_createdAt desc) {
      _id,
      name,
      "slug": slug.current,
      price,
      salePrice,
      description,
      inStock,
      isFeatured,
      rating,
      reviewCount,
      "category": category->slug.current,
      "categoryName": category->title,
      "brand": brand->title,
      "images": images[]{
        "url": asset->url,
        "alt": alt
      },
      "tags": tags[]
    }`;

    const data = await client.fetch(query);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Sanity product fetch error (falling back to local repository):', err);
    return [];
  }
}

/**
 * Query categories from Sanity CMS.
 */
export async function fetchSanityCategories(): Promise<any[]> {
  const client = getSanityClient();
  if (!client || !isSanityConfigured()) {
    return [];
  }

  try {
    const query = `*[_type == "category"] | order(order asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      icon,
      "imageUrl": image.asset->url
    }`;

    const data = await client.fetch(query);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Sanity category fetch error:', err);
    return [];
  }
}

/**
 * Query hero banners from Sanity CMS.
 */
export async function fetchSanityBanners(): Promise<any[]> {
  const client = getSanityClient();
  if (!client || !isSanityConfigured()) {
    return [];
  }

  try {
    const query = `*[_type in ["banner", "heroBanner"] && (isActive == true || !defined(isActive))] | order(order asc) {
      _id,
      title,
      altText,
      targetUrl,
      order,
      isActive,
      "desktopImageUrl": desktopImage.asset->url,
      "mobileImageUrl": mobileImage.asset->url
    }`;

    const data = await client.fetch(query);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Sanity banners fetch error:', err);
    return [];
  }
}

/**
 * Create a new product in Sanity CMS using write token.
 */
export async function createSanityProduct(doc: {
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  category?: string;
  description?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const config = getSanityConfig();
  if (!config.token) {
    return {
      success: false,
      error: 'A Sanity API write token is required to create documents from the admin dashboard.',
    };
  }

  const client = getSanityClient();
  if (!client) {
    return { success: false, error: 'Sanity client not configured.' };
  }

  try {
    const created = await client.create({
      _type: 'product',
      name: doc.name,
      slug: {
        _type: 'slug',
        current: doc.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      },
      price: doc.price,
      salePrice: doc.salePrice || null,
      description: doc.description || '',
      inStock: doc.inStock ?? true,
      isFeatured: doc.isFeatured ?? false,
      publishedAt: new Date().toISOString(),
    });

    return { success: true, id: created._id };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
