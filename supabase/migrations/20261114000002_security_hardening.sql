-- ==============================================================================
-- SHRELL AUTOMOTIVE — COMPREHENSIVE SECURITY HARDENING & RLS POLICY MIGRATION
-- Prevents privilege escalation, role tampering, and secures all management endpoints
-- ==============================================================================

-- 1. Secure handle_new_user function against role escalation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    CASE
      WHEN LOWER(NEW.email) = 'admin@shrell.com' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    role = CASE
      WHEN LOWER(EXCLUDED.email) = 'admin@shrell.com' THEN 'admin'
      ELSE public.profiles.role
    END,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 2. Trigger to prevent non-admins from changing their own role in profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can change user roles.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- 3. Products: Require admin privileges for mutation
ALTER POLICY "Allow product management" ON public.products
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Categories: Require admin privileges for mutation
ALTER POLICY "Allow category management" ON public.categories
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Brands: Require admin privileges for mutation
ALTER POLICY "Allow brand management" ON public.brands
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Coupons: Require admin privileges for mutation
ALTER POLICY "Allow coupon management" ON public.coupons
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Store Settings: Require admin privileges for mutation
ALTER POLICY "Allow store settings management" ON public.store_settings
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. Home Sections: Require admin privileges for mutation
ALTER POLICY "Allow home sections management" ON public.home_sections
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9. Orders: Only admins can mutate order status
ALTER POLICY "Admin can update orders" ON public.orders
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 10. Order Items: Only admins can mutate order items
ALTER POLICY "Allow order items update" ON public.order_items
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 11. Inventory Movements: Only admins can record manual inventory adjustments
ALTER POLICY "Anyone can insert inventory movements" ON public.inventory_movements
TO authenticated
WITH CHECK (public.is_admin());
