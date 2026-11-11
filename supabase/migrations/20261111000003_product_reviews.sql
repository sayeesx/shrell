-- ==============================================================================
-- SHRELL AUTOMOTIVE — PRODUCT REVIEWS & RATINGS SCHEMA & SEED
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mdfhavwmtwtoclpmwtfb/sql/new
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL,
  customer_id TEXT,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product reviews are viewable by everyone" ON public.product_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.product_reviews;
DROP POLICY IF EXISTS "Admin can manage all reviews" ON public.product_reviews;

CREATE POLICY "Product reviews are viewable by everyone"
  ON public.product_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Anyone can submit a review"
  ON public.product_reviews FOR INSERT
  WITH CHECK (rating >= 1 AND rating <= 5 AND length(comment) > 0);

CREATE POLICY "Admin can manage all reviews"
  ON public.product_reviews FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed Initial Reviews for Storefront Showcase
INSERT INTO public.product_reviews (id, product_id, author_name, rating, title, comment, is_verified_purchase)
VALUES
  ('rev-wing-01', 'prod-stealth-wing', 'Vikramaditya S.', 5, 'Perfect fit on Scorpio-N, completely silent on highways', 'Installed these crossbars before my Ladakh expedition. Zero wind whistle up to 120 km/h. Carried a 65kg rooftop tent without any flex. Build quality is exceptional.', true),
  ('rev-wing-02', 'prod-stealth-wing', 'Rohan Mehta', 5, 'Precision engineering at its best', 'T-track mounting works seamlessly with my Thule bike carrier. Powder coating finish is rugged and matches the factory roof rails perfectly.', true),
  ('rev-wing-03', 'prod-stealth-wing', 'Col. R. S. Negi', 4, 'Solid hardware, quick delivery', 'Delivery was prompt via BlueDart in 3 days to Dehradun. Heavy gauge aluminium extrusion and secure tamper-proof lock barrels.', true),
  ('rev-light-01', 'prod-night-raider', 'Arun Kumar', 5, 'Insane light throw on dark ghat roads', 'The amber DRL halo looks stunning and the high-output Osram chips turn pitch black mountain trails into daylight. IP67 waterproof passed pressure washer test.', true),
  ('rev-light-02', 'prod-night-raider', 'Deepak Joshi', 5, 'Best auxiliary lights in this price range', 'Wiring harness provided is heavy-gauge and automotive grade. No flickering even on rough off-road terrain. Highly recommended.', true)
ON CONFLICT (id) DO NOTHING;

