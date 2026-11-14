-- ==============================================================================
-- SHRELL AUTOMOTIVE — MIGRATION: CONSOLIDATE TO SINGLE BRAND "SHRELL"
-- There is only one brand: SHRELL.
-- 1. Upserts the canonical SHRELL brand record
-- 2. Updates all products to reference brand_id = 'brand-shrell' and brand_name = 'SHRELL'
-- 3. Deactivates legacy multi-brand records
-- ==============================================================================

-- 1. Upsert canonical SHRELL brand
INSERT INTO public.brands (id, name, slug, logo_url, country_of_origin, is_active)
VALUES (
  'brand-shrell',
  'SHRELL',
  'shrell',
  '/logos/shrell-brandicon_no-bg.png',
  'India',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = 'SHRELL',
  slug = 'shrell',
  is_active = true,
  logo_url = '/logos/shrell-brandicon_no-bg.png',
  country_of_origin = 'India';

-- 2. Update existing products to canonical SHRELL brand
UPDATE public.products
SET
  brand_id = 'brand-shrell',
  brand_name = 'SHRELL'
WHERE brand_id IS DISTINCT FROM 'brand-shrell' OR brand_name IS DISTINCT FROM 'SHRELL';

-- 3. Deactivate legacy brands
UPDATE public.brands
SET is_active = false
WHERE id != 'brand-shrell';
