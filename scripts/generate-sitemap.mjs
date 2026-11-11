/**
 * Automated XML Sitemap Generator for SHRELL Automotive
 * Queries published products and categories from Supabase, formats compliant XML,
 * and writes to public/sitemap.xml for build distribution.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://shrell.vercel.app';

// Safe entity escaper for XML
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Safely format ISO date to YYYY-MM-DD
function formatLastMod(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// Helper to load .env variables safely
function loadEnv() {
  const env = {};
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const idx = line.indexOf('=');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          env[key] = val;
        }
      }
    }
  } catch (_) {}
  return env;
}

async function fetchSitemapData() {
  const env = loadEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project') && !supabaseUrl.includes('placeholder')) {
    try {
      console.log('[Sitemap] Fetching live catalogue data from Supabase...');
      const sb = createClient(supabaseUrl, supabaseKey);

      const [prodsRes, catsRes] = await Promise.all([
        sb
          .from('products')
          .select('id, name, slug, is_active, updated_at, created_at')
          .eq('is_active', true),
        sb
          .from('categories')
          .select('id, name, slug, is_active')
          .eq('is_active', true),
      ]);

      if (!prodsRes.error && prodsRes.data && prodsRes.data.length > 0) {
        return {
          products: prodsRes.data,
          categories: catsRes.data || [],
        };
      }
      if (prodsRes.error) {
        console.warn('[Sitemap] Supabase products query error:', prodsRes.error.message);
      }
    } catch (err) {
      console.warn('[Sitemap] Failed to query Supabase, falling back to local seed data:', err.message);
    }
  }

  // Fallback to static seed data
  console.log('[Sitemap] Using fallback local catalogue definitions...');
  return {
    products: [
      { slug: 'stealth-wing-aerodynamic-crossbars', is_active: true, updated_at: '2026-03-01T10:00:00Z' },
      { slug: 'night-sabre-bi-led-projector-pods', is_active: true, updated_at: '2026-03-01T10:00:00Z' },
      { slug: 'terrashield-7d-all-weather-floor-liners', is_active: true, updated_at: '2026-03-01T10:00:00Z' },
      { slug: 'apex-dual-cylinder-rapid-tyre-inflator', is_active: true, updated_at: '2026-03-01T10:00:00Z' },
    ],
    categories: [
      { slug: 'air-fresheners', is_active: true },
      { slug: 'auxiliary-lighting', is_active: true },
      { slug: 'all-weather-floor-protection', is_active: true },
      { slug: 'tyre-care-air-systems', is_active: true },
      { slug: 'touring-recovery-gear', is_active: true },
    ],
  };
}

async function generateSitemap() {
  const { products, categories } = await fetchSitemapData();

  const entries = [];
  const seenUrls = new Set();

  function addUrl(loc, priority, changefreq, lastmod) {
    if (seenUrls.has(loc)) return;
    seenUrls.add(loc);
    entries.push({ loc, priority, changefreq, lastmod });
  }

  // 1. Homepage (Daily, priority 1.0)
  addUrl(`${SITE_URL}/`, '1.0', 'daily', null);

  // 2. Main Store Catalogue (Daily, priority 0.9)
  addUrl(`${SITE_URL}/catalogue`, '0.9', 'daily', null);

  // 3. Category Pages (Weekly, priority 0.8)
  for (const cat of categories) {
    if (cat.is_active && cat.slug) {
      const cleanSlug = cat.slug.trim().toLowerCase();
      addUrl(`${SITE_URL}/catalogue?category=${escapeXml(cleanSlug)}`, '0.8', 'weekly', null);
    }
  }

  // 4. Active Product Detail Pages (Weekly, priority 0.8)
  for (const prod of products) {
    if (prod.is_active && prod.slug) {
      const cleanSlug = prod.slug.trim();
      const lastmod = formatLastMod(prod.updated_at || prod.created_at);
      addUrl(`${SITE_URL}/product/${escapeXml(cleanSlug)}`, '0.8', 'weekly', lastmod);
    }
  }

  // 5. Public Storefront Policies (Monthly, priority 0.5)
  addUrl(`${SITE_URL}/shipping-policy`, '0.5', 'monthly', null);
  addUrl(`${SITE_URL}/returns-policy`, '0.5', 'monthly', null);
  addUrl(`${SITE_URL}/privacy-policy`, '0.5', 'monthly', null);

  // Build XML String
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const entry of entries) {
    xml += '  <url>\n';
    xml += `    <loc>${entry.loc}</loc>\n`;
    if (entry.lastmod) {
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    }
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  // Ensure public directory exists
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`[Sitemap] Generated ${entries.length} URLs in ${sitemapPath}`);

  // Also write to dist/sitemap.xml if dist exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
    console.log(`[Sitemap] Also mirrored to dist/sitemap.xml`);
  }
}

generateSitemap().catch((err) => {
  console.error('[Sitemap] Critical error generating sitemap:', err);
  process.exit(1);
});

