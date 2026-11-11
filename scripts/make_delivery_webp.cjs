const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2E3A"/>
      <stop offset="50%" stop-color="#FF000E"/>
      <stop offset="100%" stop-color="#B0000A"/>
    </linearGradient>
    <linearGradient id="darkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#261619"/>
      <stop offset="100%" stop-color="#0A0808"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF666E"/>
      <stop offset="100%" stop-color="#FF000E"/>
    </linearGradient>
    <linearGradient id="windshieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0.98"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Speed motion wind lines -->
  <g opacity="0.85">
    <path d="M25 210 L110 210" stroke="#FF000E" stroke-width="6" stroke-linecap="round" stroke-dasharray="14 10"/>
    <path d="M10 245 L85 245" stroke="#FF2E3A" stroke-width="7" stroke-linecap="round" stroke-dasharray="16 12"/>
    <path d="M35 280 L130 280" stroke="#FF000E" stroke-width="5" stroke-linecap="round" stroke-dasharray="18 10"/>
    <path d="M15 315 L95 315" stroke="#FF666E" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- Ground Shadow -->
  <ellipse cx="270" cy="392" rx="180" ry="20" fill="#000000" opacity="0.4" filter="blur(6px)"/>

  <!-- Main Vehicle Group -->
  <g filter="url(#dropShadow)">
    <!-- Van Cargo Body (Aerodynamic angled cabin & cargo bay) -->
    <path d="M 110 320 
             L 110 180 
             Q 110 160 130 160 
             L 330 160 
             Q 350 160 365 175 
             L 420 235 
             Q 435 252 445 272 
             L 455 315 
             Q 458 335 440 335 
             L 125 335 
             Q 110 335 110 320 Z" 
          fill="url(#bodyGrad)"/>

    <!-- Lower chassis rocker panel -->
    <path d="M 110 310 L 452 310 L 452 335 L 110 335 Z" fill="url(#darkGrad)" opacity="0.9"/>

    <!-- Cabin Windshield -->
    <path d="M 345 175 
             L 410 238 
             L 345 238 
             Z" 
          fill="url(#windshieldGrad)"/>
    
    <!-- Side window glass reflection line -->
    <path d="M 355 185 L 400 230" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>

    <!-- Front Bumper & Modern Headlight Strip -->
    <path d="M 440 280 L 455 285 L 450 305 L 435 302 Z" fill="#F1F5F9"/>
    <path d="M 442 282 L 456 287" stroke="#60A5FA" stroke-width="4" stroke-linecap="round"/>
    <!-- LED Glow -->
    <circle cx="452" cy="286" r="4.5" fill="#BFDBFE" opacity="0.95"/>

    <!-- Aero Roof Spoiler -->
    <path d="M 105 160 Q 130 152 160 155 L 120 165 Z" fill="#0A0808"/>

    <!-- Side Graphic Stripe: SHRELL Racing/Express Stripe -->
    <polygon points="110,240 290,240 275,258 110,258" fill="#0A0808" opacity="0.95"/>
    <polygon points="110,244 285,244 280,250 110,250" fill="#FFFFFF"/>

    <!-- SHRELL EXPRESS Branding Text on Cargo Side -->
    <text x="130" y="215" font-family="'DM Sans', 'Inter', Arial, sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" letter-spacing="3">SHRELL</text>
    <text x="256" y="215" font-family="'DM Sans', 'Inter', Arial, sans-serif" font-weight="700" font-size="14" fill="#FFE0E2" letter-spacing="2">EXPRESS</text>

    <!-- Cargo Box Badge Emblem -->
    <g transform="translate(130, 268) scale(0.72)">
      <rect x="0" y="0" width="36" height="36" rx="7" fill="#0A0808"/>
      <!-- Lightning bolt / fast shipping icon inside badge -->
      <path d="M 20 4 L 10 20 L 18 20 L 16 32 L 26 16 L 18 16 Z" fill="#FFD700"/>
    </g>
    <text x="164" y="289" font-family="'DM Sans', 'Inter', Arial, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF" letter-spacing="1.5">FREE DELIVERY</text>

    <!-- Cargo Panel Door Seam Lines -->
    <line x1="215" y1="160" x2="215" y2="310" stroke="#650008" stroke-width="2" opacity="0.7"/>
    <line x1="330" y1="160" x2="330" y2="310" stroke="#650008" stroke-width="2" opacity="0.7"/>
    <!-- Door handle -->
    <rect x="315" y="245" width="10" height="4" rx="2" fill="#FFFFFF" opacity="0.85"/>

    <!-- Rear Tail Light -->
    <rect x="110" y="200" width="5" height="24" rx="2" fill="#FF0000"/>
    <rect x="110" y="204" width="3" height="16" rx="1" fill="#FFAAAA"/>

    <!-- Front Wheel Arch -->
    <path d="M 360 335 A 42 42 0 0 1 430 335" fill="#0A0808"/>
    <!-- Rear Wheel Arch -->
    <path d="M 145 335 A 42 42 0 0 1 215 335" fill="#0A0808"/>

    <!-- REAR WHEEL -->
    <g transform="translate(180, 335)">
      <!-- Outer Tire -->
      <circle cx="0" cy="0" r="36" fill="#1A1A1A"/>
      <circle cx="0" cy="0" r="33" fill="#2B2B2B"/>
      <!-- Alloy Rim -->
      <circle cx="0" cy="0" r="24" fill="#E2E8F0"/>
      <!-- Rim spokes & hub -->
      <circle cx="0" cy="0" r="18" fill="#0A0808"/>
      <!-- Crimson Hubcap Center -->
      <circle cx="0" cy="0" r="8" fill="#FF000E"/>
      <!-- Spoke lines -->
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="0" y1="-16" x2="0" y2="16" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="-11" y1="-11" x2="11" y2="11" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="-11" y1="11" x2="11" y2="-11" stroke="#E2E8F0" stroke-width="3"/>
    </g>

    <!-- FRONT WHEEL -->
    <g transform="translate(395, 335)">
      <!-- Outer Tire -->
      <circle cx="0" cy="0" r="36" fill="#1A1A1A"/>
      <circle cx="0" cy="0" r="33" fill="#2B2B2B"/>
      <!-- Alloy Rim -->
      <circle cx="0" cy="0" r="24" fill="#E2E8F0"/>
      <!-- Rim spokes & hub -->
      <circle cx="0" cy="0" r="18" fill="#0A0808"/>
      <!-- Crimson Hubcap Center -->
      <circle cx="0" cy="0" r="8" fill="#FF000E"/>
      <!-- Spoke lines -->
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="0" y1="-16" x2="0" y2="16" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="-11" y1="-11" x2="11" y2="11" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="-11" y1="11" x2="11" y2="-11" stroke="#E2E8F0" stroke-width="3"/>
    </g>
  </g>
</svg>
`;

async function main() {
  const targetDir = path.resolve('public/images');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svg.trim());
  
  // Render high-res WebP with transparent background and high quality
  const outPath1 = path.join(targetDir, 'shrell-delivery.webp');
  await sharp(svgBuffer)
    .resize(512, 512)
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(outPath1);

  // Copy to root public/shrell-delivery.webp as well for convenience
  const outPath2 = path.resolve('public/shrell-delivery.webp');
  fs.copyFileSync(outPath1, outPath2);

  const stats1 = fs.statSync(outPath1);
  const kb = (stats1.size / 1024).toFixed(2);
  console.log(`Successfully generated shrell-delivery.webp at ${outPath1} (${kb} KB)`);
  console.log(`File is less than 50 KB: ${stats1.size < 50 * 1024 ? 'YES' : 'NO'}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
