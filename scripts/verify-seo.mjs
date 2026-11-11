/**
 * Comprehensive SEO System Verification Test Suite for SHRELL Automotive
 * Validates:
 * 1. robots.txt structure and disallow rules
 * 2. sitemap.xml XML syntax, canonical URLs, lack of private routes, lastmod dates
 * 3. merchant-feed.xml XML syntax, INR currency, stock status, MPN/GTIN identifiers
 * 4. Structured data (JSON-LD) generation: Product, Offer, Breadcrumbs, Organization, WebSite
 * 5. Crawler handler simulation for social bots (WhatsApp, Facebook, Twitter, LinkedIn)
 */

import fs from 'fs';
import path from 'path';
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '../src/infrastructure/seo/schemaGenerators.ts';
import crawlerHandler from '../api/crawler-handler.js';

const results = { passed: 0, failed: 0, tests: [] };

function test(name, assertion, details) {
  if (assertion) {
    results.passed++;
    console.log(`[PASS] ${name}`);
    if (details) console.log(`       ${details}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${name}`);
    if (details) console.error(`       ${details}`);
  }
  results.tests.push({ name, pass: Boolean(assertion), details });
}

async function runVerification() {
  console.log('======================================================');
  console.log('SHRELL TECHNICAL & ON-PAGE SEO VERIFICATION SUITE');
  console.log('======================================================\n');

  // --- 1. ROBOTS.TXT VERIFICATION ---
  console.log('--- 1. ROBOTS.TXT CHECKS ---');
  const robotsPublicPath = path.resolve(process.cwd(), 'public', 'robots.txt');
  const robotsDistPath = path.resolve(process.cwd(), 'dist', 'robots.txt');

  test('robots.txt exists in public/', fs.existsSync(robotsPublicPath));
  test('robots.txt exists in dist/', fs.existsSync(robotsDistPath));

  const robotsContent = fs.readFileSync(robotsPublicPath, 'utf8');
  test('robots.txt allows public crawling', robotsContent.includes('Allow: /'));
  test('robots.txt disallows /admin', robotsContent.includes('Disallow: /admin'));
  test('robots.txt disallows /checkout', robotsContent.includes('Disallow: /checkout'));
  test('robots.txt disallows /cart', robotsContent.includes('Disallow: /cart'));
  test('robots.txt specifies canonical sitemap.xml', robotsContent.includes('Sitemap: https://shrell.vercel.app/sitemap.xml'));

  // --- 2. SITEMAP.XML VERIFICATION ---
  console.log('\n--- 2. SITEMAP.XML CHECKS ---');
  const sitemapPublicPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  const sitemapDistPath = path.resolve(process.cwd(), 'dist', 'sitemap.xml');

  test('sitemap.xml exists in public/', fs.existsSync(sitemapPublicPath));
  test('sitemap.xml exists in dist/', fs.existsSync(sitemapDistPath));

  const sitemapContent = fs.readFileSync(sitemapPublicPath, 'utf8');
  test('sitemap.xml has valid XML declaration', sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  test('sitemap.xml specifies urlset namespace', sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));

  // Check URL entries
  const urlMatches = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  test('sitemap.xml contains at least 10 canonical URLs', urlMatches.length >= 10, `Found ${urlMatches.length} URLs`);

  const hasHomepage = urlMatches.includes('https://shrell.vercel.app/');
  const hasCatalogue = urlMatches.includes('https://shrell.vercel.app/catalogue');
  const hasCrossbars = urlMatches.some(u => u.includes('stealth-wing-aerodynamic-crossbars'));
  const hasLighting = urlMatches.some(u => u.includes('night-sabre-bi-led-projector-pods'));
  const hasCategory = urlMatches.some(u => u.includes('catalogue?category='));

  test('sitemap includes homepage', hasHomepage);
  test('sitemap includes main catalogue', hasCatalogue);
  test('sitemap includes crossbars product', hasCrossbars);
  test('sitemap includes lighting product', hasLighting);
  test('sitemap includes category URLs', hasCategory);

  // Check no private URLs
  const hasAdmin = urlMatches.some(u => u.includes('/admin'));
  const hasCart = urlMatches.some(u => u.includes('/cart'));
  const hasCheckout = urlMatches.some(u => u.includes('/checkout'));
  test('sitemap excludes private routes (/admin, /cart, /checkout)', !hasAdmin && !hasCart && !hasCheckout);

  // Check lastmod dates
  const lastmodMatches = [...sitemapContent.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(m => m[1]);
  test('sitemap contains valid YYYY-MM-DD lastmod timestamps', lastmodMatches.length > 0 && lastmodMatches.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)));

  // Check for duplicates
  const uniqueUrls = new Set(urlMatches);
  test('sitemap contains zero duplicate URLs', uniqueUrls.size === urlMatches.length, `${uniqueUrls.size} unique of ${urlMatches.length} total`);

  // --- 3. GOOGLE MERCHANT CENTER FEED CHECKS ---
  console.log('\n--- 3. GOOGLE MERCHANT CENTER FEED CHECKS ---');
  const feedPublicPath = path.resolve(process.cwd(), 'public', 'merchant-feed.xml');
  const feedDistPath = path.resolve(process.cwd(), 'dist', 'merchant-feed.xml');

  test('merchant-feed.xml exists in public/', fs.existsSync(feedPublicPath));
  test('merchant-feed.xml exists in dist/', fs.existsSync(feedDistPath));

  const feedContent = fs.readFileSync(feedPublicPath, 'utf8');
  test('merchant feed specifies Google base namespace', feedContent.includes('xmlns:g="http://base.google.com/ns/1.0"'));
  test('merchant feed prices formatted in INR', feedContent.includes(' INR</g:price>'));
  test('merchant feed includes stock availability', feedContent.includes('<g:availability>in_stock</g:availability>'));
  test('merchant feed includes MPN tags', feedContent.includes('<g:mpn>'));
  test('merchant feed includes new condition', feedContent.includes('<g:condition>new</g:condition>'));

  // --- 4. STRUCTURED DATA (JSON-LD) GENERATORS CHECKS ---
  console.log('\n--- 4. STRUCTURED DATA (JSON-LD) GENERATORS CHECKS ---');
  const mockProduct = {
    id: 'prod-vahn-roof-01',
    name: 'Stealth Wing Aerodynamic Crossbars',
    slug: 'stealth-wing-aerodynamic-crossbars',
    sku: 'RR-WING-BLK',
    shortDescription: 'Extruded aircraft-grade T6 aluminium crossbars with anti-theft key lock.',
    description: 'Precision Touring Cargo Backbone engineered for Indian touring.',
    pricePaisa: 1499900, // ₹14,999.00
    stockQuantity: 18,
    brandName: 'SHRELL OEM',
    categoryName: 'Air Fresheners',
    images: [{ id: '1', productId: '1', url: '/logos/shrell-logo-white.png', altText: 'Front', sortOrder: 1, isPrimary: true }],
  };

  // Test Product Schema without reviews
  const prodSchemaNoReviews = generateProductSchema(mockProduct, { rating: 5, reviewCount: 0 });
  test('Product Schema @type is Product', prodSchemaNoReviews['@type'] === 'Product');
  test('Product Schema converts integer Paisa to Rupees string (₹14,999.00)', prodSchemaNoReviews.offers.price === '14999.00');
  test('Product Schema currency is INR', prodSchemaNoReviews.offers.priceCurrency === 'INR');
  test('Product Schema in stock availability is schema.org/InStock', prodSchemaNoReviews.offers.availability === 'https://schema.org/InStock');
  test('Product Schema canonical offer URL is valid', prodSchemaNoReviews.offers.url === 'https://shrell.vercel.app/product/stealth-wing-aerodynamic-crossbars');
  test('Product Schema omits aggregateRating when reviewCount is 0', prodSchemaNoReviews.aggregateRating === undefined);

  // Test Product Schema with verified reviews
  const prodSchemaWithReviews = generateProductSchema(mockProduct, { rating: 4.8, reviewCount: 12 });
  test('Product Schema includes aggregateRating when verified reviews exist', prodSchemaWithReviews.aggregateRating?.ratingValue === '4.8' && prodSchemaWithReviews.aggregateRating?.reviewCount === 12);

  // Test BreadcrumbList Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Roof Racks', url: '/catalogue?category=touring-recovery-gear' },
    { name: mockProduct.name, url: `/product/${mockProduct.slug}` },
  ]);
  test('BreadcrumbList Schema @type is BreadcrumbList', breadcrumbSchema['@type'] === 'BreadcrumbList');
  test('BreadcrumbList has 3 ordered levels', breadcrumbSchema.itemListElement.length === 3 && breadcrumbSchema.itemListElement[0].position === 1);
  test('BreadcrumbList URLs are absolute and canonical', breadcrumbSchema.itemListElement[0].item === 'https://shrell.vercel.app/');

  // Test Organization Schema
  const orgSchema = generateOrganizationSchema();
  test('Organization Schema @type is Organization', orgSchema['@type'] === 'Organization');
  test('Organization Schema contains legal entity name', orgSchema.legalName === 'SHRELL Automotive India Private Limited');
  test('Organization Schema specifies Indian address and phone', orgSchema.address.addressCountry === 'IN' && orgSchema.telephone === '+91-98765-43210');

  // Test WebSite Schema
  const webSiteSchema = generateWebSiteSchema();
  test('WebSite Schema @type is WebSite', webSiteSchema['@type'] === 'WebSite');
  test('WebSite Schema has active SearchAction target', webSiteSchema.potentialAction.target.urlTemplate.includes('/catalogue?search='));

  // --- 5. SOCIAL MEDIA CRAWLER HANDLER SIMULATION ---
  console.log('\n--- 5. SOCIAL MEDIA CRAWLER HANDLER SIMULATION ---');
  let mockResStatus = 200;
  let mockHeaders = {};
  let mockBody = '';

  const mockRes = {
    status(code) { mockResStatus = code; return this; },
    setHeader(key, val) { mockHeaders[key] = val; return this; },
    send(body) { mockBody = body; return this; },
  };

  // Simulate WhatsApp / Facebook request for product
  await crawlerHandler({ query: { slug: 'stealth-wing-aerodynamic-crossbars' } }, mockRes);
  test('Crawler Handler returns 200 OK for valid product slug', mockResStatus === 200);
  test('Crawler Handler outputs HTML content-type', mockHeaders['Content-Type'].includes('text/html'));
  test('Crawler Handler includes product Open Graph title', mockBody.includes('Stealth Wing Aerodynamic Crossbars | Buy Online at SHRELL'));
  test('Crawler Handler includes Open Graph product price in INR', mockBody.includes('content="14999"') && mockBody.includes('content="INR"'));
  test('Crawler Handler includes absolute Open Graph image URL', mockBody.includes('<meta property="og:image" content="https://'));
  test('Crawler Handler includes Twitter summary_large_image card', mockBody.includes('<meta name="twitter:card" content="summary_large_image" />'));
  test('Crawler Handler includes browser redirect for human visitors', mockBody.includes('window.location.replace'));

  // Simulate 404 for invalid product slug
  await crawlerHandler({ query: { slug: 'non-existent-automotive-product-xyz' } }, mockRes);
  test('Crawler Handler returns 404 with noindex for nonexistent slug', mockResStatus === 404 && mockBody.includes('noindex'));

  // --- SUMMARY ---
  console.log('\n======================================================');
  console.log(`VERIFICATION COMPLETE: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('======================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});

