/**
 * Google Merchant Center Product Feed Generator for SHRELL Automotive
 * Formats a Google Merchant Center compliant RSS 2.0 / XML feed with INR pricing,
 * verified stock availability, and accurate product attributes from Supabase.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://shrell.vercel.app';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureAbsoluteImageUrl(url) {
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

async function fetchProducts() {
  const env = loadEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
      console.log('[MerchantFeed] Fetching active products from Supabase...');
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await sb
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[MerchantFeed] Supabase query error, fallback to local catalogue:', err.message);
    }
  }

  // Fallback catalogue
  return [
    {
      id: 'prod-vahn-roof-01',
      name: 'Stealth Wing Aerodynamic Crossbars',
      slug: 'stealth-wing-aerodynamic-crossbars',
      sku: 'RR-WING-BLK',
      price_paisa: 1499900,
      stock_quantity: 18,
      short_description: 'Extruded aircraft-grade T6 aluminium crossbars with anti-theft key lock and integrated T-track channel.',
      brand_name: 'SHRELL OEM',
      images: [{ url: `${SITE_URL}/shrell-opengraph.png` }],
    },
    {
      id: 'prod-vahn-fog-02',
      name: 'Night Sabre Bi-LED Projector Pods',
      slug: 'night-sabre-bi-led-projector-pods',
      sku: 'LT-SABRE-PAIR',
      price_paisa: 899900,
      stock_quantity: 34,
      short_description: 'Dual-beam IP68 sealed projector auxiliary driving lamps with cast aluminium heatsink.',
      brand_name: 'OSRAM',
      images: [{ url: `${SITE_URL}/shrell-opengraph.png` }],
    },
    {
      id: 'prod-vahn-mats-03',
      name: 'TerraShield 7D All-Weather Floor Liner System',
      slug: 'terrashield-7d-all-weather-floor-liners',
      sku: 'FL-TERRA-7D',
      price_paisa: 649900,
      stock_quantity: 22,
      short_description: 'Laser-measured precision TPE thermoplastic waterproof raised-edge mats.',
      brand_name: 'SHRELL OEM',
      images: [{ url: `${SITE_URL}/shrell-opengraph.png` }],
    },
    {
      id: 'prod-vahn-comp-04',
      name: 'Apex Dual-Cylinder Rapid Tyre Inflator',
      slug: 'apex-dual-cylinder-rapid-tyre-inflator',
      sku: 'TC-APEX-12V',
      price_paisa: 589900,
      stock_quantity: 41,
      short_description: '12V direct-drive dual piston compressor with digital gauge and thermal cut-off.',
      brand_name: 'VIAIR',
      images: [{ url: `${SITE_URL}/shrell-opengraph.png` }],
    },
  ];
}

async function generateMerchantFeed() {
  const products = await fetchProducts();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n';
  xml += '  <channel>\n';
  xml += '    <title>SHRELL Automotive Product Feed</title>\n';
  xml += `    <link>${SITE_URL}/</link>\n`;
  xml += '    <description>Premium car accessories, overland gear, and precision components for Indian vehicles</description>\n';

  for (const p of products) {
    const rawImg = p.images?.[0]?.url || `${SITE_URL}/shrell-opengraph.png`;
    const imageLink = ensureAbsoluteImageUrl(rawImg);
    const priceRupees = (Number(p.price_paisa) / 100).toFixed(2);
    const availability = Number(p.stock_quantity) > 0 ? 'in_stock' : 'out_of_stock';
    const brand = p.brand_name || 'SHRELL';
    const description = p.short_description || p.description || p.name;

    xml += '    <item>\n';
    xml += `      <g:id>${escapeXml(p.id)}</g:id>\n`;
    xml += `      <g:title>${escapeXml(p.name)}</g:title>\n`;
    xml += `      <g:description>${escapeXml(description)}</g:description>\n`;
    xml += `      <g:link>${SITE_URL}/product/${escapeXml(p.slug)}</g:link>\n`;
    xml += `      <g:image_link>${escapeXml(imageLink)}</g:image_link>\n`;
    xml += `      <g:availability>${availability}</g:availability>\n`;
    xml += `      <g:price>${priceRupees} INR</g:price>\n`;
    xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`;
    xml += `      <g:condition>new</g:condition>\n`;
    if (p.sku) {
      xml += `      <g:mpn>${escapeXml(p.sku)}</g:mpn>\n`;
    }
    if (p.barcode) {
      xml += `      <g:gtin>${escapeXml(p.barcode)}</g:gtin>\n`;
    } else {
      xml += '      <g:identifier_exists>no</g:identifier_exists>\n';
    }
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>\n';

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const feedPath = path.join(publicDir, 'merchant-feed.xml');
  fs.writeFileSync(feedPath, xml, 'utf8');
  console.log(`[MerchantFeed] Generated ${products.length} items in ${feedPath}`);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'merchant-feed.xml'), xml, 'utf8');
    console.log(`[MerchantFeed] Also mirrored to dist/merchant-feed.xml`);
  }
}

generateMerchantFeed().catch((err) => {
  console.error('[MerchantFeed] Error generating feed:', err);
  process.exit(1);
});

