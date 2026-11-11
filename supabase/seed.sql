-- ==============================================================================
-- SHRELL / VAHN AUTOMOTIVE — PRODUCTION SEED DATA (supabase/seed.sql)
-- ==============================================================================

-- 1. Store Settings
INSERT INTO public.store_settings (key, value) VALUES 
('store_info', '{"storeName": "SHRELL Automotive", "contactEmail": "orders@shrell.com", "contactPhone": "+91 98765 43210", "whatsappSupportNumber": "919876543210", "currency": "INR"}'::jsonb),
('shipping_rules', '{"freeShippingThresholdPaisa": 499900, "standardShippingPaisa": 25000, "gstRatePercent": 18}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Categories
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, display_order) VALUES
('cat-air-fresheners', 'Air Fresheners', 'air-fresheners', 'Organic cedar fiber blocks, solar kinetic turbine diffusers, and luxury car cabin fragrances.', '/logos/shrell-brandicon_no-bg.png', true, 1),
('cat-lighting', 'Auxiliary & Fog Lighting', 'auxiliary-lighting', 'IP68-rated amber and white driving beams, laser projectors, and modular LED lightbars.', '/logos/shrell-brandicon_no-bg.png', true, 2),
('cat-protection', 'All-Weather Floor Protection', 'all-weather-floor-protection', 'Laser-measured TPE thermoplastic 3D/7D mats engineered for heavy monsoon mud and dust.', '/logos/shrell-brandicon_no-bg.png', true, 3),
('cat-tyre-care', 'Tyre Care & Air Systems', 'tyre-care-air-systems', 'Direct-drive 12V high-output compressors, digital deflators, and precision puncture kits.', '/logos/shrell-brandicon_no-bg.png', true, 4),
('cat-touring', 'Touring & Recovery Gear', 'touring-recovery-gear', 'Kinetic snatch straps, soft shackles, rapid tyre deflators, and off-grid power solutions.', '/logos/shrell-brandicon_no-bg.png', true, 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

-- 3. Brands
INSERT INTO public.brands (id, name, slug, logo_url, country_of_origin, is_active) VALUES
('brand-vahn', 'Automotive Equipment', 'automotive-equipment', '/logos/shrell-brandicon_no-bg.png', 'India', true),
('brand-thule', 'Cargo Solutions', 'cargo-solutions', '/logos/shrell-brandicon_no-bg.png', 'Sweden', true),
('brand-osram', 'Illumination Systems', 'illumination-systems', '/logos/shrell-brandicon_no-bg.png', 'Germany', true),
('brand-viair', 'Air & Compressor Systems', 'air-compressor-systems', '/logos/shrell-brandicon_no-bg.png', 'United States', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 4. Vehicle Compatibility Hierarchy
INSERT INTO public.vehicle_manufacturers (id, name, slug, country) VALUES
('make-tata', 'Tata Motors', 'tata-motors', 'India'),
('make-mahindra', 'Mahindra', 'mahindra', 'India'),
('make-toyota', 'Toyota', 'toyota', 'Japan'),
('make-hyundai', 'Hyundai', 'hyundai', 'South Korea'),
('make-vw', 'Volkswagen', 'volkswagen', 'Germany'),
('make-skoda', 'Skoda', 'skoda', 'Czech Republic')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.vehicle_models (id, make_id, name, slug, body_type) VALUES
('mod-safari', 'make-tata', 'Safari', 'safari', 'SUV'),
('mod-harrier', 'make-tata', 'Harrier', 'harrier', 'SUV'),
('mod-scorpio-n', 'make-mahindra', 'Scorpio-N', 'scorpio-n', 'SUV'),
('mod-xuv700', 'make-mahindra', 'XUV700', 'xuv700', 'SUV'),
('mod-thar', 'make-mahindra', 'Thar', 'thar', 'SUV'),
('mod-fortuner', 'make-toyota', 'Fortuner', 'fortuner', 'SUV'),
('mod-creta', 'make-hyundai', 'Creta', 'creta', 'SUV'),
('mod-virtus', 'make-vw', 'Virtus', 'virtus', 'Sedan'),
('mod-slavia', 'make-skoda', 'Slavia', 'slavia', 'Sedan')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.vehicle_variants (id, model_id, variant_name, year_start, year_end) VALUES
('var-safari-dark', 'mod-safari', 'Accomplished+ / Dark Edition', 2023, NULL),
('var-scorpio-z8l', 'mod-scorpio-n', 'Z8L 4x4 Automatic', 2022, NULL),
('var-xuv700-ax7l', 'mod-xuv700', 'AX7L AWD', 2021, NULL),
('var-fortuner-leg', 'mod-fortuner', 'Legender 4x4 AT', 2021, NULL),
('var-virtus-gt', 'mod-virtus', 'GT Plus 1.5 TSI DSG', 2022, NULL)
ON CONFLICT (id) DO UPDATE SET variant_name = EXCLUDED.variant_name;

-- 5. Products Catalog
INSERT INTO public.products (
  id, name, slug, sku, barcode, short_description, description,
  category_id, category_name, brand_id, brand_name,
  price_paisa, compare_at_price_paisa, cost_price_paisa,
  is_universal_fit, is_active, is_featured, stock_quantity,
  weight_grams, dimensions_cm, installation_difficulty, warranty_months,
  images, specifications
) VALUES
(
  'prod-vahn-roof-01',
  'Stealth Wing Aerodynamic Crossbars',
  'stealth-wing-aerodynamic-crossbars',
  'RR-WING-BLK',
  '8901234567801',
  'Extruded aircraft-grade T6 aluminium crossbars with anti-theft key lock and integrated T-track channel.',
  'High-tensile extruded 6063-T6 tempered aluminium construction with dual-sided rubber wind-diffuser strip reducing wind drag up to 70%. Cast zinc core locking mechanism with master keys.',
  'cat-touring', 'Touring & Recovery Gear', 'brand-thule', 'Cargo Solutions',
  1499900, 1849900, 850000,
  false, true, true, 18,
  4800, '120x12x8', 'Moderate', 36,
  '[{"id": "img-1", "url": "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=1200", "altText": "Stealth Wing Crossbars", "sortOrder": 1, "isPrimary": true}]'::jsonb,
  '[{"name": "Load Capacity", "value": "75 kg dynamic / 250 kg static"}, {"name": "Material", "value": "6063-T6 Structural Aluminium"}, {"name": "Locking System", "value": "Coded dual-key barrel lock"}]'::jsonb
),
(
  'prod-vahn-fog-02',
  'Night Sabre Bi-LED Projector Pods',
  'night-sabre-bi-led-projector-pods',
  'LT-SABRE-PAIR',
  '8901234567802',
  'Dual-spectrum 3000K Amber / 6000K Hyper-White auxiliary projector pods with laser diode high-beam assist.',
  'Engineered for dense Himalayan fog and Western Ghats monsoons. Dual-throw optical TIR lens projects razor-sharp low cutoff without blinding oncoming vehicles.',
  'cat-lighting', 'Auxiliary & Fog Lighting', 'brand-osram', 'Illumination Systems',
  899900, 1199900, 480000,
  true, true, true, 34,
  1450, '9x9x7', 'Professional Recommended', 24,
  '[{"id": "img-2", "url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200", "altText": "Night Sabre Pods", "sortOrder": 1, "isPrimary": true}]'::jsonb,
  '[{"name": "Luminous Flux", "value": "9,600 Lumens / Pair"}, {"name": "Waterproof Rating", "value": "IP68 Submersible"}, {"name": "Operating Voltage", "value": "9V - 32V DC"}]'::jsonb
),
(
  'prod-vahn-mats-03',
  'TerraShield 7D All-Weather Floor Liner System',
  'terrashield-7d-all-weather-floor-liners',
  'FL-TERRA-7D',
  '8901234567803',
  'Laser 3D digitised deep-dish floor liners with detachable dual-layer monsoon curly coil grass mats.',
  'Custom moulded for Tata Safari, Harrier, Scorpio-N and XUV700 cabins. Raised 45mm containment lip traps up to 3 litres of mud, slush and spilled liquids.',
  'cat-protection', 'All-Weather Floor Protection', 'brand-vahn', 'Automotive Equipment',
  649900, 799900, 320000,
  false, true, true, 22,
  5200, '75x55x18', 'Plug & Play', 12,
  '[{"id": "img-3", "url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200", "altText": "TerraShield Floor Liners", "sortOrder": 1, "isPrimary": true}]'::jsonb,
  '[{"name": "Material", "value": "Virgin Thermoplastic Elastomer (TPE)"}, {"name": "Odor Rating", "value": "100% Odorless Non-Toxic"}, {"name": "Fitment Precision", "value": "0.2mm Laser 3D Scanned"}]'::jsonb
),
(
  'prod-vahn-comp-04',
  'Apex Dual-Cylinder Rapid Tyre Inflator',
  'apex-dual-cylinder-rapid-tyre-inflator',
  'TC-APEX-12V',
  '8901234567804',
  'Heavy-duty direct-drive 12V 85L/min twin-piston air compressor with digital auto-cutoff gauge.',
  'Inflates an SUV 265/65 R18 tyre from 15 PSI to 35 PSI in under 2 minutes. Features anodised aluminium heatsink and 5-metre braided braided air hose.',
  'cat-tyre-care', 'Tyre Care & Air Systems', 'brand-viair', 'Air & Compressor Systems',
  589900, 749900, 310000,
  true, true, true, 41,
  3800, '28x14x20', 'Plug & Play', 24,
  '[{"id": "img-4", "url": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200", "altText": "Apex Rapid Air Compressor", "sortOrder": 1, "isPrimary": true}]'::jsonb,
  '[{"name": "Max Flow Rate", "value": "85 Litres / Minute"}, {"name": "Max Working Pressure", "value": "150 PSI"}, {"name": "Power Connector", "value": "Direct Battery Alligator Clamps"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_paisa = EXCLUDED.price_paisa,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  images = EXCLUDED.images;

-- 6. Coupons
INSERT INTO public.coupons (
  id, code, discount_type, discount_value, min_order_paisa, max_discount_paisa, max_uses, used_count, is_active
) VALUES
('coup-exp10', 'EXP10', 'PERCENTAGE', 10, 299900, 150000, 500, 18, true),
('coup-shrell500', 'SHRELL500', 'FIXED_AMOUNT', 50000, 499900, 50000, 1000, 62, true),
('coup-monsoon', 'MONSOON2026', 'PERCENTAGE', 15, 699900, 250000, 250, 4, true)
ON CONFLICT (id) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  is_active = EXCLUDED.is_active;

