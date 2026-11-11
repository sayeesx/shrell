-- ==============================================================================
-- SHRELL AUTOMOTIVE — HOME SCREEN CMS SECTIONS TABLE & SEED
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mdfhavwmtwtoclpmwtfb/sql/new
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.home_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  section_type TEXT NOT NULL CHECK (section_type IN ('PRODUCTS_GRID', 'PRODUCTS_CAROUSEL', 'CATEGORIES_GRID', 'EDITORIAL_BENTO', 'BANNER_PROMO')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category_slug TEXT,
  item_limit INTEGER DEFAULT 4,
  view_all_url TEXT,
  custom_banner_url TEXT,
  custom_banner_target_url TEXT,
  bento_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_home_sections_display_order ON public.home_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_home_sections_is_active ON public.home_sections(is_active);

-- Enable RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Home sections are viewable by everyone" ON public.home_sections;
DROP POLICY IF EXISTS "Allow home sections management" ON public.home_sections;

CREATE POLICY "Home sections are viewable by everyone"
  ON public.home_sections FOR SELECT
  USING (true);

CREATE POLICY "Allow home sections management"
  ON public.home_sections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed default sections matching current storefront layout
INSERT INTO public.home_sections (id, title, subtitle, section_type, display_order, is_active, category_slug, item_limit, view_all_url)
VALUES 
  ('sec-crazy-finds', 'Crazy Finds', 'Blink and you''ll miss it', 'PRODUCTS_GRID', 1, true, NULL, 4, '/catalogue'),
  ('sec-festival-deals', 'Festival Declutter Deals 🪔', 'Verified genuine equipment with up to ₹15,000 instant festival discounts', 'PRODUCTS_GRID', 2, true, NULL, 4, '/catalogue'),
  ('sec-editorial-bento', 'Engineering & Precision', 'High-performance automotive hardware overview', 'EDITORIAL_BENTO', 3, true, NULL, 0, '/catalogue')
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, is_active = EXCLUDED.is_active;
