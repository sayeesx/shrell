import {
  Brand,
  Category,
  Coupon,
  Product,
  StoreSettings,
  VehicleCompatibility,
  VehicleMake,
  VehicleModel,
  VehicleVariant,
} from '../../domain/types';

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'SHRELL Automotive',
  contactEmail: 'orders@shrell.com',
  contactPhone: '+91 98765 43210',
  whatsappSupportNumber: '919876543210',
  storeUpiId: '',
  storeUpiName: '',
  freeShippingThresholdPaisa: 30000, // ₹300.00
  standardShippingPaisa: 6000, // ₹60.00
  gstRatePercent: 18,
  currency: 'INR',
  ogTitle: 'SHRELL Automotive | Premium Car Accessories in India',
  ogDescription:
    'Shop premium car accessories and touring equipment for Indian vehicles. OSRAM auxiliary lighting, aerodynamic crossbars, 7D floor liners, and heavy-duty 12V tyre inflators.',
  ogImageUrl: '/shrell-opengraph.png',
  ogImageAlt: 'SHRELL Automotive - Premium Car Accessories & Touring Equipment',
};

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-shrell',
    name: 'SHRELL',
    slug: 'shrell',
    isActive: true,
    countryOfOrigin: 'India',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-car-interior',
    name: 'Car Interior',
    slug: 'car-interior',
    description: 'Precision-fit 7D floor liners, seat comfort systems, cabin organizers, and interior care accessories.',
    imageUrl: '/icons/floormats.svg',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'cat-car-exterior',
    name: 'Car Exterior',
    slug: 'car-exterior',
    description: 'Aerodynamic roof racks, Osram bi-LED auxiliary lighting, weather deflectors, and exterior equipment.',
    imageUrl: '/icons/carcare.svg',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'cat-microfiber-cloths',
    name: 'Microfiber Cloths',
    slug: 'microfiber-cloths',
    description: 'Heavy-GSM edgeless detailing microfibers, plush twist-loop drying towels, and scratch-free polishing cloths.',
    imageUrl: '/icons/wash.svg',
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'cat-kits-combos',
    name: 'Kits and Combos',
    slug: 'kits-and-combos',
    description: 'Curated multi-stage detailing bundles, DIY maintenance packs, and complete vehicle preparation combos.',
    imageUrl: '/icons/tools.svg',
    isActive: true,
    displayOrder: 4,
  },
  {
    id: 'cat-car-perfumes',
    name: 'Car Perfumes',
    slug: 'car-perfumes',
    description: 'Artisan car perfumes, solar turbine diffusers, organic fiber scent blocks, and luxury fragrances.',
    imageUrl: '/icons/freshner.svg',
    isActive: true,
    displayOrder: 5,
  },
];

export const INITIAL_MAKES: VehicleMake[] = [
  { id: 'make-tata', name: 'Tata Motors', slug: 'tata-motors', country: 'India' },
  { id: 'make-mahindra', name: 'Mahindra', slug: 'mahindra', country: 'India' },
  { id: 'make-toyota', name: 'Toyota', slug: 'toyota', country: 'Japan' },
  { id: 'make-hyundai', name: 'Hyundai', slug: 'hyundai', country: 'South Korea' },
  { id: 'make-vw', name: 'Volkswagen', slug: 'volkswagen', country: 'Germany' },
  { id: 'make-skoda', name: 'Skoda', slug: 'skoda', country: 'Czech Republic' },
];

export const INITIAL_MODELS: VehicleModel[] = [
  { id: 'mod-safari', makeId: 'make-tata', name: 'Safari', slug: 'safari', bodyType: 'SUV' },
  { id: 'mod-harrier', makeId: 'make-tata', name: 'Harrier', slug: 'harrier', bodyType: 'SUV' },
  { id: 'mod-scorpio-n', makeId: 'make-mahindra', name: 'Scorpio-N', slug: 'scorpio-n', bodyType: 'SUV' },
  { id: 'mod-xuv700', makeId: 'make-mahindra', name: 'XUV700', slug: 'xuv700', bodyType: 'SUV' },
  { id: 'mod-thar', makeId: 'make-mahindra', name: 'Thar', slug: 'thar', bodyType: 'SUV' },
  { id: 'mod-fortuner', makeId: 'make-toyota', name: 'Fortuner', slug: 'fortuner', bodyType: 'SUV' },
  { id: 'mod-creta', makeId: 'make-hyundai', name: 'Creta', slug: 'creta', bodyType: 'SUV' },
  { id: 'mod-virtus', makeId: 'make-vw', name: 'Virtus', slug: 'virtus', bodyType: 'Sedan' },
  { id: 'mod-slavia', makeId: 'make-skoda', name: 'Slavia', slug: 'slavia', bodyType: 'Sedan' },
];

export const INITIAL_VARIANTS: VehicleVariant[] = [
  { id: 'var-safari-dark', modelId: 'mod-safari', variantName: 'Accomplished+ / Dark Edition', yearStart: 2023 },
  { id: 'var-scorpio-z8l', modelId: 'mod-scorpio-n', variantName: 'Z8L 4x4 Automatic', yearStart: 2022 },
  { id: 'var-xuv700-ax7l', modelId: 'mod-xuv700', variantName: 'AX7L AWD', yearStart: 2021 },
  { id: 'var-fortuner-leg', modelId: 'mod-fortuner', variantName: 'Legender 4x4 AT', yearStart: 2021 },
  { id: 'var-virtus-gt', modelId: 'mod-virtus', variantName: 'GT Plus 1.5 TSI DSG', yearStart: 2022 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-vahn-roof-01',
    name: 'Stealth Wing Aerodynamic Crossbars',
    slug: 'stealth-wing-aerodynamic-crossbars',
    sku: 'RR-WING-BLK',
    barcode: '8901234567801',
    shortDescription: 'Extruded aircraft-grade T6 aluminium crossbars with anti-theft key lock and integrated T-track channel.',
    description: `### Precision Touring Cargo Backbone

Engineered specifically for Indian touring speeds and monsoons. The Stealth Wing crossbars feature an aerodynamic teardrop profile reducing cabin wind drag by up to 70% compared to traditional square roof bars.

#### Key Engineering Features
- High-tensile extruded 6063-T6 tempered aluminium construction.
- Dual-sided rubber wind-diffuser strip to eliminate whistling at highway speeds (80-120 km/h).
- Heavy-duty cast zinc core locking mechanism with 2 coded master keys.
- Universal standard 20mm T-slot channel compatible with cycle carriers, roof boxes, and kayak mounts.
- Dynamic load capacity tested to 85 kg (Static capacity: 180 kg for rooftop tents).`,
    categoryId: 'cat-car-exterior',
    categoryName: 'Car Exterior',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 1499900, // ₹14,999.00
    compareAtPricePaisa: 1799900, // ₹17,999.00
    costPricePaisa: 850000,
    isUniversalFit: false,
    isActive: true,
    isFeatured: true,
    weightGrams: 4200,
    dimensionsCm: '125x12x8',
    installationDifficulty: 'Moderate',
    warrantyMonths: 36,
    badge: 'Selling Fast',
    stockQuantity: 18,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    specifications: [
      { group: 'Material', name: 'Bar Structure', value: 'Anodized 6063-T6 Aluminium' },
      { group: 'Capacity', name: 'Dynamic Load Rating', value: '85 kg' },
      { group: 'Capacity', name: 'Static Load Rating', value: '180 kg' },
      { group: 'Security', name: 'Locking Cylinder', value: 'Cast Zinc Keyed Locks Included' },
      { group: 'Finish', name: 'Surface Coating', value: 'Matte Technical Black Powder Coat' },
    ],
    images: [
      {
        id: 'img-roof-01',
        productId: 'prod-vahn-roof-01',
        url: '/logos/shrell-full_white-text_black-logo.png',
        altText: 'SHRELL Stealth Wing Aerodynamic Crossbars',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
  {
    id: 'prod-osram-light-02',
    name: 'FX500-CB High-Beam Driving LED Lightbar',
    slug: 'fx500-cb-high-beam-led-lightbar',
    sku: 'LED-FX500CB',
    barcode: '8901234567802',
    shortDescription: '500-metre reach combo-beam auxiliary driving lightbar with ECE approval and IP67 waterproof certification.',
    description: `### Extreme Distance Highway & Off-Road Illumination

Navigate unlit state highways and mountain passes with complete confidence. The FX500-CB combines long-distance spotlight optics with broad peripheral floodlight coverage.

#### Engineering Highlights
- 20 high-performance automotive-grade LEDs delivering 3,500 raw lumens.
- 440-metre beam throw at 1 lux illumination threshold.
- Integrated thermal management system with rear heat-sink fins for extended longevity.
- High-impact polycarbonate lens resistant to gravel strikes and thermal shocks.
- Fully street-legal ECE R112 certified auxiliary high beam.`,
    categoryId: 'cat-car-exterior',
    categoryName: 'Car Exterior',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 2249900, // ₹22,499.00
    compareAtPricePaisa: 2599900,
    costPricePaisa: 1500000,
    isUniversalFit: true,
    isActive: true,
    isFeatured: true,
    weightGrams: 2100,
    dimensionsCm: '56x6x8',
    installationDifficulty: 'Professional Recommended',
    warrantyMonths: 60,
    badge: 'New Launch',
    stockQuantity: 12,
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z',
    specifications: [
      { group: 'Lighting', name: 'Luminous Flux', value: '3,500 Lumens' },
      { group: 'Lighting', name: 'Color Temperature', value: '6,000 Kelvin (Crisp Daylight)' },
      { group: 'Protection', name: 'IP Rating', value: 'IP67 Waterproof & Dustproof' },
      { group: 'Electrical', name: 'Operating Voltage', value: '12V / 24V DC Compatible' },
      { group: 'Certification', name: 'Homologation', value: 'ECE R112 / E4 Approved' },
    ],
    images: [
      {
        id: 'img-light-01',
        productId: 'prod-osram-light-02',
        url: '/logos/shrell-full_white-text_black-logo.png',
        altText: 'SHRELL FX500-CB Driving Lightbar',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
  {
    id: 'prod-vahn-mats-03',
    name: 'ArmorForm All-Weather 3D Laser-Fit TPE Mats',
    slug: 'armorform-all-weather-3d-mats',
    sku: 'MAT-AF-SUV',
    barcode: '8901234567803',
    shortDescription: 'Moulded non-toxic TPE floor liners with raised perimeter dams to contain water, slush, and red mud.',
    description: `### Total Cabin Floor Protection

Manufactured from automotive-grade Thermoplastic Elastomer (TPE), the ArmorForm floor system offers complete floorboard containment. Unlike PVC or rubber mats, TPE remains odorless even in scorching 45°C Indian summer cabin temperatures.

#### Key Attributes
- 3D laser-scanned precision fit tailored to vehicle floor pan contours.
- 55mm high perimeter containment lip traps up to 3 litres of liquids and mud.
- Deep chevron drainage grooves direct moisture away from foot contact surfaces.
- Integrated floorboard snap-lock anchors prevent mat slipping under clutch and brake pedals.
- Easily cleaned in 2 minutes with a high-pressure hose.`,
    categoryId: 'cat-car-interior',
    categoryName: 'Car Interior',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 649900, // ₹6,499.00
    compareAtPricePaisa: 799900,
    costPricePaisa: 320000,
    isUniversalFit: false,
    isActive: true,
    isFeatured: true,
    weightGrams: 3800,
    dimensionsCm: '75x55x12',
    installationDifficulty: 'Plug & Play',
    warrantyMonths: 24,
    stockQuantity: 24,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    specifications: [
      { group: 'Material', name: 'Polymer Compound', value: '100% Recyclable Medical-Grade TPE' },
      { group: 'Design', name: 'Perimeter Wall Height', value: '55 mm Raised Edge Dam' },
      { group: 'Safety', name: 'Floor Retention', value: 'OEM Compatible Snap Anchors' },
      { group: 'Thermal', name: 'Operating Range', value: '-30°C to +85°C' },
    ],
    images: [
      {
        id: 'img-mat-01',
        productId: 'prod-vahn-mats-03',
        url: '/logos/shrell-full_white-text_black-logo.png',
        altText: 'SHRELL ArmorForm All-Weather 3D TPE Floor Liners',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
  {
    id: 'prod-viair-pump-04',
    name: 'Portable 12V Heavy-Duty Air Compressor (150 PSI)',
    slug: 'portable-12v-heavy-duty-air-compressor-150psi',
    sku: 'PUMP-400-12V',
    barcode: '8901234567804',
    shortDescription: 'Direct-battery connected 150 PSI continuous-duty compressor capable of inflating 35-inch SUV tyres in under 5 minutes.',
    description: `### Industrial Emergency & Expedition Tyre Inflation

Designed for rugged off-highway touring and long road trips where gas station air gauges are unreliable or unavailable. This compressor connects directly to your car battery terminal clamps for clean, non-fuse-blowing high amperage power.

#### Technical Specifications
- Max working pressure: 150 PSI.
- Free flow rate: 2.30 CFM (65 Litres/min) at 0 PSI.
- Inflates a 265/65 R17 SUV tyre from 15 PSI to 35 PSI in under 2 minutes 30 seconds.
- 5-in-1 quick-connect coiled air hose with integrated illuminated inline pressure gauge and tyre deflation valve.
- Heavy-duty ballistic nylon padded transport bag included.`,
    categoryId: 'cat-kits-combos',
    categoryName: 'Kits and Combos',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 1299900, // ₹12,999.00
    compareAtPricePaisa: 1449900,
    costPricePaisa: 800000,
    isUniversalFit: true,
    isActive: true,
    isFeatured: true,
    weightGrams: 4700,
    dimensionsCm: '28x15x18',
    installationDifficulty: 'Plug & Play',
    warrantyMonths: 12,
    stockQuantity: 9,
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-03-12T14:00:00Z',
    specifications: [
      { group: 'Performance', name: 'Max Pressure', value: '150 PSI' },
      { group: 'Performance', name: 'Air Flow Rate', value: '65 LPM (2.3 CFM)' },
      { group: 'Electrical', name: 'Power Connection', value: 'Heavy Duty Dual Battery Clamps' },
      { group: 'Electrical', name: 'Current Draw', value: '30 Amperes Max' },
      { group: 'Duty Cycle', name: 'Duty Cycle Rating', value: '33% @ 100 PSI (20 Min On / 40 Min Off)' },
    ],
    images: [
      {
        id: 'img-air-01',
        productId: 'prod-viair-pump-04',
        url: '/logos/shrell-full_white-text_black-logo.png',
        altText: 'SHRELL Portable 12V Air Compressor',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
  {
    id: 'prod-vahn-kinetic-05',
    name: 'Tactical Kinetic Recovery Snatch Rope (9m x 24mm)',
    slug: 'tactical-kinetic-recovery-snatch-rope',
    sku: 'REC-KIN-9M',
    barcode: '8901234567805',
    shortDescription: '12-strand double-braided nylon kinetic rope with 30% elongation for smooth kinetic off-road vehicle recovery.',
    description: `### Physics-Driven Kinetic Vehicle Extraction

Eliminates the brutal jerk and chassis damage associated with rigid steel tow cables. Under load, this Kinetic Rope stretches up to 30%, accumulating kinetic energy from the recovery vehicle and releasing it smoothly to pull stranded 4x4 vehicles out of sand, slush, and river beds.

#### Engineering Specs
- Minimum Breaking Strength (MBS): 12,500 kg (122 kN).
- Premium 100% Double Braided Nylon (Polyamide 6.6) construction.
- Polymer dipped eyes with protective Cordura chafe sleeves for abrasion resistance against rocks and recovery shackles.
- Water, chemical, and UV resistant coating.`,
    categoryId: 'cat-car-exterior',
    categoryName: 'Car Exterior',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 589900, // ₹5,899.00
    compareAtPricePaisa: 699900,
    costPricePaisa: 290000,
    isUniversalFit: true,
    isActive: true,
    isFeatured: false,
    weightGrams: 2800,
    dimensionsCm: '30x30x12',
    installationDifficulty: 'Plug & Play',
    warrantyMonths: 24,
    stockQuantity: 15,
    createdAt: '2026-02-15T14:00:00Z',
    updatedAt: '2026-03-15T16:00:00Z',
    specifications: [
      { group: 'Strength', name: 'Minimum Breaking Strength', value: '12,500 kg (27,500 lbs)' },
      { group: 'Dynamics', name: 'Kinetic Stretch Elasticity', value: 'Up to 30% Under Max Load' },
      { group: 'Dimensions', name: 'Diameter & Length', value: '24 mm Diameter x 9 Metres Length' },
      { group: 'Material', name: 'Fibre Type', value: '100% Double-Braided Polyamide 6.6 Nylon' },
    ],
    images: [
      {
        id: 'img-rec-01',
        productId: 'prod-vahn-kinetic-05',
        url: '/logos/shrell-full_white-text_black-logo.png',
        altText: 'SHRELL Kinetic Snatch Rope',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
  {
    id: 'prod-shrell-microfiber-06',
    name: 'Ultra-Plush 600 GSM Edgeless Microfiber Towels (Pack of 3)',
    slug: 'ultra-plush-600-gsm-edgeless-microfiber-towels',
    sku: 'MF-PLUSH-600',
    barcode: '8901234567806',
    shortDescription: 'Korean split 70/30 microfiber detailing towels with laser cut edgeless borders. Scratch-free for paint and glass.',
    description: `### Professional Grade Automotive Detailing Microfibers

Engineered with 600 GSM dual-pile split microfibers. One side features long plush pile for safe waterless wash and quick detailing; reverse features dense short weave for buffing waxes and sealants.

#### Key Specs
- 70/30 polyester-to-polyamide split microfiber weave.
- Ultrasonic cut edgeless perimeter eliminates stitching swirl marks.
- Machine washable up to 500 wash cycles.`,
    categoryId: 'cat-microfiber-cloths',
    categoryName: 'Microfiber Cloths',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 89900, // ₹899.00
    compareAtPricePaisa: 129900,
    costPricePaisa: 45000,
    isUniversalFit: true,
    isActive: true,
    isFeatured: true,
    weightGrams: 450,
    dimensionsCm: '40x40x3',
    installationDifficulty: 'Plug & Play',
    warrantyMonths: 12,
    stockQuantity: 85,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
    specifications: [
      { group: 'Material', name: 'Microfiber Blend', value: '70% Polyester / 30% Polyamide' },
      { group: 'Density', name: 'GSM Rating', value: '600 GSM' },
      { group: 'Border', name: 'Edge Treatment', value: 'Ultrasonic Laser Cut Edgeless' },
    ],
    images: [
      {
        id: 'img-mf-01',
        productId: 'prod-shrell-microfiber-06',
        url: '/icons/wash.svg',
        altText: 'Ultra-Plush 600 GSM Edgeless Microfiber Towels',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
  {
    id: 'prod-shrell-perfume-07',
    name: 'Solar Kinetic Turbine Car Cabin Perfume Diffuser',
    slug: 'solar-kinetic-turbine-car-cabin-perfume-diffuser',
    sku: 'PF-SOLAR-BLK',
    barcode: '8901234567807',
    shortDescription: 'Aerospace alloy solar rotating turbine diffuser with natural beechwood essential oil fragrance ring.',
    description: `### Solar-Powered Continuous Cabin Fragrance

Silent magnetic levitation rotor activates automatically under direct sunlight. Solid beechwood aromatic core ensures zero liquid leakage and constant, subtle aroma diffusion for up to 90 days.

#### Key Highlights
- High-efficiency photovoltaic solar drive activates without battery.
- Machined anodized aerospace aluminum housing.
- Natural plant-based non-toxic essential oil ring.`,
    categoryId: 'cat-car-perfumes',
    categoryName: 'Car Perfumes',
    brandId: 'brand-shrell',
    brandName: 'SHRELL',
    pricePaisa: 129900, // ₹1,299.00
    compareAtPricePaisa: 199900,
    costPricePaisa: 60000,
    isUniversalFit: true,
    isActive: true,
    isFeatured: true,
    weightGrams: 320,
    dimensionsCm: '8x8x6',
    installationDifficulty: 'Plug & Play',
    warrantyMonths: 12,
    stockQuantity: 50,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
    specifications: [
      { group: 'Drive', name: 'Solar Motor', value: 'Photovoltaic Mag-Lev Turbine' },
      { group: 'Fragrance', name: 'Aroma Core', value: 'Natural Beechwood Solid Ring' },
      { group: 'Duration', name: 'Scent Longevity', value: 'Up to 90 Days' },
    ],
    images: [
      {
        id: 'img-perf-01',
        productId: 'prod-shrell-perfume-07',
        url: '/icons/freshner.svg',
        altText: 'Solar Kinetic Turbine Car Cabin Perfume Diffuser',
        sortOrder: 1,
        isPrimary: true,
      },
    ],
  },
];

export const INITIAL_COMPATIBILITY: VehicleCompatibility[] = [
  // Crossbars fit Safari, Harrier, Scorpio-N, XUV700, Fortuner
  { id: 'c-1', productId: 'prod-vahn-roof-01', modelId: 'mod-safari', yearStart: 2021, notes: 'Fits factory flush roof rails' },
  { id: 'c-2', productId: 'prod-vahn-roof-01', modelId: 'mod-harrier', yearStart: 2020, notes: 'Fits factory flush roof rails' },
  { id: 'c-3', productId: 'prod-vahn-roof-01', modelId: 'mod-scorpio-n', yearStart: 2022, notes: 'Fits standard roof rack mounts' },
  { id: 'c-4', productId: 'prod-vahn-roof-01', modelId: 'mod-xuv700', yearStart: 2021, notes: 'Mounts on integrated roof tracks' },
  { id: 'c-5', productId: 'prod-vahn-roof-01', modelId: 'mod-fortuner', yearStart: 2017, notes: 'Fits OEM roof rails' },

  // Floor liners fit Safari, Harrier, Scorpio-N
  { id: 'c-6', productId: 'prod-vahn-mats-03', modelId: 'mod-safari', yearStart: 2021, notes: '7-seater laser cut' },
  { id: 'c-7', productId: 'prod-vahn-mats-03', modelId: 'mod-harrier', yearStart: 2020, notes: '5-seater laser cut' },
  { id: 'c-8', productId: 'prod-vahn-mats-03', modelId: 'mod-scorpio-n', yearStart: 2022, notes: 'Full 3-row coverage' },
  { id: 'c-9', productId: 'prod-vahn-mats-03', modelId: 'mod-xuv700', yearStart: 2021, notes: 'Includes 3rd row pass-through' },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon-shrell10',
    code: 'SHRELL10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderPaisa: 500000, // ₹5,000.00
    maxDiscountPaisa: 150000, // ₹1,500.00 max discount
    maxUses: 500,
    usedCount: 23,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'coupon-vahn10',
    code: 'VAHN10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderPaisa: 500000,
    maxDiscountPaisa: 150000,
    maxUses: 500,
    usedCount: 23,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'coupon-expedition500',
    code: 'EXPEDITION500',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000, // ₹500.00 off
    minOrderPaisa: 300000, // ₹3,000.00 min order
    maxUses: 1000,
    usedCount: 67,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    isActive: true,
  },
];
