-- ==============================================================================
-- SHRELL AUTOMOTIVE — E-COMMERCE RLS POLICY & ADMIN PERMISSIONS MIGRATION
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/mdfhavwmtwtoclpmwtfb/sql/new
-- ==============================================================================

-- 1. Confirm admin user and grant admin profile role
UPDATE auth.users 
SET email_confirmed_at = timezone('utc'::text, now()) 
WHERE email = 'admin@shrell.com';

INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, 'SHRELL Operations Director', email, 'admin'
FROM auth.users 
WHERE email = 'admin@shrell.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 2. PRODUCTS: Allow Public Read and Admin/E-Commerce CRUD
DROP POLICY IF EXISTS "Active products are readable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Allow product management" ON public.products;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Allow product management"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. CATEGORIES: Allow Public Read and Management
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Allow category management"
  ON public.categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. BRANDS: Allow Public Read and Management
DROP POLICY IF EXISTS "Brands are readable by everyone" ON public.brands;
DROP POLICY IF EXISTS "Admin can manage brands" ON public.brands;

CREATE POLICY "Brands are viewable by everyone"
  ON public.brands FOR SELECT
  USING (true);

CREATE POLICY "Allow brand management"
  ON public.brands FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. COUPONS: Allow Public Read and Management
DROP POLICY IF EXISTS "Active coupons are readable by everyone" ON public.coupons;
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;

CREATE POLICY "Coupons are viewable by everyone"
  ON public.coupons FOR SELECT
  USING (true);

CREATE POLICY "Allow coupon management"
  ON public.coupons FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure standard storefront coupons exist
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_paisa, max_discount_paisa, max_uses, used_count, is_active)
VALUES 
  ('coup-vahn10', 'VAHN10', 'PERCENTAGE', 10, 299900, 150000, 1000, 0, true),
  ('coup-shrell100', 'SHRELL100', 'FIXED_AMOUNT', 10000, 99900, 10000, 500, 0, true)
ON CONFLICT (code) DO UPDATE 
SET is_active = true, discount_value = EXCLUDED.discount_value;

-- 6. ORDERS & ORDER ITEMS: Allow Checkout and Order Tracking
DROP POLICY IF EXISTS "Anyone can create an order (guest or auth)" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or order by ID" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;

CREATE POLICY "Orders are viewable by everyone"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create an order"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert order items with order" ON public.order_items;
DROP POLICY IF EXISTS "Order items viewable with order" ON public.order_items;

CREATE POLICY "Order items are viewable by everyone"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- 7. INVENTORY MOVEMENTS: Allow Read and Atomic Movement Logging
DROP POLICY IF EXISTS "Admin can view inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "System and admin can insert inventory movements" ON public.inventory_movements;

CREATE POLICY "Inventory movements are viewable by everyone"
  ON public.inventory_movements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert inventory movements"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (true);

-- 8. STORE SETTINGS: Allow Read and Management
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.store_settings;
DROP POLICY IF EXISTS "Admin can manage settings" ON public.store_settings;

CREATE POLICY "Store settings are viewable by everyone"
  ON public.store_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow store settings management"
  ON public.store_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. VEHICLES & FITMENTS: Allow Read and Management
DROP POLICY IF EXISTS "Vehicle data is readable by everyone" ON public.vehicle_manufacturers;
DROP POLICY IF EXISTS "Vehicle models are readable by everyone" ON public.vehicle_models;
DROP POLICY IF EXISTS "Vehicle variants are readable by everyone" ON public.vehicle_variants;
DROP POLICY IF EXISTS "Product compatibility is readable by everyone" ON public.product_compatibility;
DROP POLICY IF EXISTS "Admin can manage vehicles" ON public.vehicle_manufacturers;
DROP POLICY IF EXISTS "Admin can manage vehicle models" ON public.vehicle_models;
DROP POLICY IF EXISTS "Admin can manage vehicle variants" ON public.vehicle_variants;
DROP POLICY IF EXISTS "Admin can manage product compatibility" ON public.product_compatibility;

CREATE POLICY "Allow vehicle_manufacturers all" ON public.vehicle_manufacturers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow vehicle_models all" ON public.vehicle_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow vehicle_variants all" ON public.vehicle_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow product_compatibility all" ON public.product_compatibility FOR ALL USING (true) WITH CHECK (true);
