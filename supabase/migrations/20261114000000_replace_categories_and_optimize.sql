-- ==============================================================================
-- SHRELL AUTOMOTIVE — MIGRATION: REPLACE CATEGORIES & EGRESS OPTIMIZATIONS
-- 1. Updates taxonomy to the 5 official Shrell categories
-- 2. Migrates existing products cleanly without broken references
-- 3. Adds composite indexes to minimize database scan overhead and egress
-- ==============================================================================

-- 1. Upsert the 5 official categories
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, display_order)
VALUES
  (
    'cat-car-interior',
    'Car Interior',
    'car-interior',
    'Precision-fit 7D floor liners, seat comfort systems, cabin organizers, and interior care accessories.',
    '/icons/floormats.svg',
    true,
    1
  ),
  (
    'cat-car-exterior',
    'Car Exterior',
    'car-exterior',
    'Aerodynamic roof racks, Osram bi-LED auxiliary lighting, weather deflectors, and exterior equipment.',
    '/icons/carcare.svg',
    true,
    2
  ),
  (
    'cat-microfiber-cloths',
    'Microfiber Cloths',
    'microfiber-cloths',
    'Heavy-GSM edgeless detailing microfibers, plush twist-loop drying towels, and scratch-free polishing cloths.',
    '/icons/wash.svg',
    true,
    3
  ),
  (
    'cat-kits-combos',
    'Kits and Combos',
    'kits-and-combos',
    'Curated multi-stage detailing bundles, DIY maintenance packs, and complete vehicle preparation combos.',
    '/icons/tools.svg',
    true,
    4
  ),
  (
    'cat-car-perfumes',
    'Car Perfumes',
    'car-perfumes',
    'Artisan car perfumes, solar turbine diffusers, organic fiber scent blocks, and luxury fragrances.',
    '/icons/freshner.svg',
    true,
    5
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- 2. Re-assign existing products from legacy dummy categories to new official categories
UPDATE public.products 
SET category_id = 'cat-car-interior', category_name = 'Car Interior' 
WHERE category_id = 'cat-protection' OR category_name ILIKE '%floor%' OR category_name ILIKE '%interior%';

UPDATE public.products 
SET category_id = 'cat-car-exterior', category_name = 'Car Exterior' 
WHERE category_id IN ('cat-lighting', 'cat-touring') OR category_name ILIKE '%lighting%' OR category_name ILIKE '%touring%';

UPDATE public.products 
SET category_id = 'cat-car-perfumes', category_name = 'Car Perfumes' 
WHERE category_id = 'cat-air-fresheners' OR category_name ILIKE '%freshener%' OR category_name ILIKE '%perfume%';

UPDATE public.products 
SET category_id = 'cat-kits-combos', category_name = 'Kits and Combos' 
WHERE category_id = 'cat-tyre-care' OR category_name ILIKE '%tyre%' OR category_name ILIKE '%combo%';

-- 3. Delete obsolete categories
DELETE FROM public.categories 
WHERE id NOT IN (
  'cat-car-interior',
  'cat-car-exterior',
  'cat-microfiber-cloths',
  'cat-kits-combos',
  'cat-car-perfumes'
);

-- 4. Performance & Egress Optimizations: Composite Indexes
-- These indexes allow index-only scans for active products and categories,
-- dramatically reducing disk I/O, CPU, and egress bandwidth on Supabase Free Tier.
CREATE INDEX IF NOT EXISTS idx_products_active_cat 
  ON public.products(is_active, category_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_featured 
  ON public.products(is_active, is_featured) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_categories_active_order 
  ON public.categories(is_active, display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_home_sections_active_order 
  ON public.home_sections(is_active, display_order) 
  WHERE is_active = true;
