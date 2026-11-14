import type { Product } from '../../domain/types.ts';

export const SITE_URL = 'https://shrell.vercel.app';

/**
 * Ensures an image URL is absolute and HTTPS.
 */
export function ensureAbsoluteImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return `${SITE_URL}/shrell-opengraph.png`;
  }
  let clean = url.trim();
  if (clean.startsWith('http://res.cloudinary.com/')) {
    clean = clean.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/');
  }
  if (clean.startsWith('//')) {
    return `https:${clean}`;
  }
  if (clean.startsWith('/')) {
    return `${SITE_URL}${clean}`;
  }
  if (clean.startsWith('http://')) {
    return clean.replace('http://', 'https://');
  }
  return clean;
}

export interface ReviewStats {
  rating?: number;
  reviewCount?: number;
  averageRating?: number;
  totalReviews?: number;
}

/**
 * 1. Product JSON-LD Schema Generator
 * Generates Schema.org Product data with price converted from Paisa to Rupees.
 * strictly omits aggregateRating if real reviewCount <= 0.
 */
export function generateProductSchema(
  product: Product,
  reviewStats?: ReviewStats
): Record<string, any> {
  const primaryImage = product.images?.[0]?.url;
  const imageUrls = (product.images && product.images.length > 0)
    ? product.images.map((img) => ensureAbsoluteImageUrl(img.url))
    : [ensureAbsoluteImageUrl(primaryImage)];

  const priceRupees = (product.pricePaisa / 100).toFixed(2);
  const inStock = product.stockQuantity > 0;
  const canonicalProductUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrls,
    description: product.shortDescription || product.description?.slice(0, 300) || product.name,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brandName?.trim() || 'SHRELL Automotive',
    },
    category: product.categoryName || undefined,
    offers: {
      '@type': 'Offer',
      price: priceRupees,
      priceCurrency: 'INR',
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonicalProductUrl,
      seller: {
        '@type': 'Organization',
        name: 'SHRELL Automotive',
        url: SITE_URL,
      },
    },
  };

  // Only attach aggregateRating if genuine verified review data exists
  const ratingScore = reviewStats?.rating ?? reviewStats?.averageRating ?? 0;
  const count = reviewStats?.reviewCount ?? reviewStats?.totalReviews ?? 0;

  if (count > 0 && ratingScore > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingScore.toFixed(1),
      reviewCount: count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * 2. BreadcrumbList JSON-LD Schema Generator
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

/**
 * 3. Organization JSON-LD Schema Generator
 */
export function generateOrganizationSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SHRELL Automotive',
    legalName: 'SHRELL Automotive India Private Limited',
    url: SITE_URL,
    logo: `${SITE_URL}/logos/shrell-logo-white.png`,
    description:
      'Specialized car accessories, touring gear, and precision components engineered for Indian vehicles.',
    telephone: '+91-98765-43210',
    email: 'orders@shrell.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot 42, Chakan Industrial Corridor, Phase II',
      addressLocality: 'Pune',
      addressRegion: 'Maharashtra',
      postalCode: '410501',
      addressCountry: 'IN',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-98765-43210',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
  };
}

/**
 * 4. WebSite JSON-LD Schema Generator with SearchAction
 */
export function generateWebSiteSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SHRELL Automotive',
    url: SITE_URL,
    description: 'Premium car accessories and touring equipment for Indian vehicles.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/catalogue?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

