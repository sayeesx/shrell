/**
 * Vercel Serverless Function: Social Media Crawler Meta Generator
 * Intercepts requests from non-JavaScript social media crawlers
 * (WhatsApp, Facebook, Twitter, LinkedIn, Slack, Telegram)
 * and returns pre-populated HTML with exact Open Graph and Twitter Card tags.
 */

import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://shrell.vercel.app';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
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

// Fallback product catalogue in case Supabase connection is offline
const FALLBACK_PRODUCTS = {
  'stealth-wing-aerodynamic-crossbars': {
    name: 'Stealth Wing Aerodynamic Crossbars',
    sku: 'RR-WING-BLK',
    pricePaisa: 1499900,
    shortDescription: 'Extruded aircraft-grade T6 aluminium crossbars with anti-theft key lock and integrated T-track channel.',
    imageUrl: `${SITE_URL}/shrell-opengraph.png`,
  },
  'night-sabre-bi-led-projector-pods': {
    name: 'Night Sabre Bi-LED Projector Pods',
    sku: 'LT-SABRE-PAIR',
    pricePaisa: 899900,
    shortDescription: 'Dual-beam IP68 sealed projector auxiliary driving lamps with cast aluminium heatsink.',
    imageUrl: `${SITE_URL}/shrell-opengraph.png`,
  },
  'terrashield-7d-all-weather-floor-liners': {
    name: 'TerraShield 7D All-Weather Floor Liner System',
    sku: 'FL-TERRA-7D',
    pricePaisa: 649900,
    shortDescription: 'Laser-measured precision TPE thermoplastic waterproof raised-edge mats.',
    imageUrl: `${SITE_URL}/shrell-opengraph.png`,
  },
  'apex-dual-cylinder-rapid-tyre-inflator': {
    name: 'Apex Dual-Cylinder Rapid Tyre Inflator',
    sku: 'TC-APEX-12V',
    pricePaisa: 589900,
    shortDescription: '12V direct-drive dual piston compressor with digital gauge and thermal cut-off.',
    imageUrl: `${SITE_URL}/shrell-opengraph.png`,
  },
};

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).send('Missing slug parameter');
  }

  let product = null;

  // Attempt to query Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await sb
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        product = {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          pricePaisa: data.price_paisa,
          shortDescription: data.short_description || data.description?.slice(0, 200),
          imageUrl: data.images?.[0]?.url || `${SITE_URL}/shrell-opengraph.png`,
        };
      }
    } catch (err) {
      console.warn('[CrawlerHandler] Supabase lookup error:', err);
    }
  }

  // Fallback lookup
  if (!product && FALLBACK_PRODUCTS[slug]) {
    product = { slug, ...FALLBACK_PRODUCTS[slug] };
  }

  if (!product) {
    // Return 404 for nonexistent products
    return res.status(404).setHeader('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Product Not Found | SHRELL Automotive</title>
  <meta name="robots" content="noindex, nofollow" />
</head>
<body>
  <h1>Product Not Found</h1>
  <p>The requested accessory is unavailable.</p>
</body>
</html>`);
  }

  const title = `${escapeXml(product.name)} | Buy Online at SHRELL`;
  const description = escapeXml(
    `Buy ${product.name} online at SHRELL. ${product.shortDescription || 'Premium automotive equipment'}. SKU: ${product.sku}. Free express delivery across India.`
  );
  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
  const absoluteImage = ensureAbsoluteImageUrl(product.imageUrl);
  const formattedPrice = (Number(product.pricePaisa) / 100).toFixed(0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SHRELL Automotive" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${absoluteImage}" />
  <meta property="og:image:secure_url" content="${absoluteImage}" />
  <meta property="og:image:alt" content="${escapeXml(product.name)} - SHRELL Automotive" />
  <meta property="product:price:amount" content="${formattedPrice}" />
  <meta property="product:price:currency" content="INR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${absoluteImage}" />

  <!-- Instant Browser Redirect for Human Users -->
  <meta http-equiv="refresh" content="0; url=${canonicalUrl}" />
  <script>
    if (typeof window !== 'undefined') {
      window.location.replace("${canonicalUrl}");
    }
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; background: #0A0808; color: #F1EEEE;">
  <article>
    <h1>${escapeXml(product.name)}</h1>
    <p><strong>Price:</strong> &#8377;${formattedPrice}</p>
    <p><strong>SKU:</strong> ${escapeXml(product.sku)}</p>
    <p>${description}</p>
    <img src="${absoluteImage}" alt="${escapeXml(product.name)}" style="max-width: 480px; height: auto; border-radius: 8px;" />
    <p><a href="${canonicalUrl}" style="color: #FF000E;">View on SHRELL Storefront &rarr;</a></p>
  </article>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  return res.status(200).send(html);
}

