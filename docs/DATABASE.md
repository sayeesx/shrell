# VAHN AUTOMOTIVE — DATABASE SCHEMA & ENTITY SPECIFICATION (DATABASE.md)

## 1. Design Principles

1. **Normalized & Portable**: Uses standard relational paradigms suitable for Appwrite Databases, PostgreSQL, or MySQL.
2. **Integer Currency Units (Paisa)**: All financial amounts (`price`, `compare_price`, `cost_price`, `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount`) are stored as unsigned 64-bit equivalent integers representing Indian Paisa (`₹1.00 = 100`).
3. **Immutable Order Snapshots**: Historical orders are completely frozen. Product edits never rewrite past invoices.
4. **Idempotency Keys**: Critical transactional records (`orders`, `payments`, `inventory_movements`) require an `idempotency_key` to eliminate duplicate submissions under network retries.

---

## 2. Collections / Tables Specification

### `categories`
- `id`: string (UUID / Appwrite ID)
- `name`: string (e.g. "Roof Racks & Storage", "Performance Lighting", "Precision Floor Protection")
- `slug`: string (unique, indexed)
- `description`: string
- `image_url`: string (optional)
- `is_active`: boolean
- `display_order`: integer
- `created_at`: string (ISO-8601 UTC)

### `brands`
- `id`: string
- `name`: string (e.g. "VAHN Engineered", "Thule Automotive", "Brembo Racing", "Osram Nightbreaker")
- `slug`: string (unique, indexed)
- `logo_url`: string
- `is_active`: boolean

### `vehicle_manufacturers` (Makes)
- `id`: string
- `name`: string (e.g. "Tata Motors", "Mahindra", "Hyundai", "Toyota", "Volkswagen", "Skoda", "BMW")
- `slug`: string (unique, indexed)
- `country`: string (e.g. "India", "Germany", "Japan")

### `vehicle_models`
- `id`: string
- `manufacturer_id`: string (FK -> vehicle_manufacturers.id, indexed)
- `name`: string (e.g. "Safari", "Harrier", "Scorpio-N", "XUV700", "Creta", "Fortuner", "Virtus", "Slavia")
- `slug`: string (indexed)
- `body_type`: string (e.g. "SUV", "Sedan", "Hatchback", "Crossover")

### `vehicle_variants`
- `id`: string
- `model_id`: string (FK -> vehicle_models.id, indexed)
- `variant_name`: string (e.g. "XZ+ Dark Edition", "Z8L 4x4", "GT Plus DSG")
- `year_start`: integer (e.g. 2020)
- `year_end`: integer (e.g. 2026, or NULL for current production)

### `products`
- `id`: string (UUID / Appwrite ID)
- `name`: string
- `slug`: string (unique, indexed)
- `sku`: string (unique, indexed, e.g. "VAHN-RR-SAFARI-01")
- `barcode`: string (optional)
- `short_description`: string
- `description`: string (Markdown / Technical specifications)
- `category_id`: string (FK -> categories.id, indexed)
- `brand_id`: string (FK -> brands.id, indexed)
- `price`: integer (in Paisa, e.g. 1499900 = ₹14,999.00)
- `compare_at_price`: integer (in Paisa, optional strike-through price)
- `cost_price`: integer (in Paisa, for admin margin calculations)
- `is_universal_fit`: boolean (indexed)
- `is_active`: boolean (indexed)
- `is_featured`: boolean (indexed)
- `weight_grams`: integer
- `dimensions_cm`: string (e.g. "120x45x15")
- `installation_difficulty`: string ("Plug & Play", "Moderate", "Professional Recommended")
- `warranty_months`: integer
- `meta_title`: string
- `meta_description`: string
- `created_at`: string (ISO-8601 UTC)
- `updated_at`: string (ISO-8601 UTC)

### `product_images`
- `id`: string
- `product_id`: string (FK -> products.id, indexed)
- `storage_file_id`: string (Appwrite storage ID or URL)
- `image_url`: string
- `alt_text`: string
- `sort_order`: integer
- `is_primary`: boolean

### `vehicle_compatibility` (Product-to-Vehicle Mapping)
- `id`: string
- `product_id`: string (FK -> products.id, indexed)
- `model_id`: string (FK -> vehicle_models.id, indexed)
- `variant_id`: string (optional, NULL means fits all variants of model)
- `year_start`: integer (optional)
- `year_end`: integer (optional)
- `notes`: string (e.g. "Requires factory roof rails")

### `inventory`
- `product_id`: string (unique, indexed, FK -> products.id)
- `quantity_on_hand`: integer
- `quantity_reserved`: integer (cart checkouts in progress)
- `quantity_available`: integer (virtual: `quantity_on_hand - quantity_reserved`)
- `low_stock_threshold`: integer (default: 5)
- `updated_at`: string (ISO-8601 UTC)

### `inventory_movements` (Audit Trail)
- `id`: string
- `product_id`: string (FK -> products.id, indexed)
- `quantity_change`: integer (positive for restock, negative for deduction)
- `movement_type`: string ("RESTOCK", "SALE", "RESERVATION", "CANCELLATION", "DAMAGE_ADJUSTMENT")
- `reference_id`: string (Order ID or Admin Adjustment ID, indexed)
- `notes`: string
- `created_by`: string
- `created_at`: string (ISO-8601 UTC)

### `customers`
- `id`: string (Linked to Appwrite Auth User ID)
- `name`: string
- `email`: string (indexed)
- `phone`: string (indexed, format: `+91XXXXXXXXXX`)
- `is_guest`: boolean
- `total_orders`: integer
- `total_spent_paisa`: integer
- `created_at`: string (ISO-8601 UTC)

### `customer_addresses`
- `id`: string
- `customer_id`: string (FK -> customers.id, indexed)
- `full_name`: string
- `phone`: string
- `address_line1`: string
- `address_line2`: string
- `city`: string
- `district`: string
- `state`: string
- `postal_code`: string (6-digit Indian PIN Code, indexed)
- `is_default`: boolean

### `orders`
- `id`: string (e.g. "VAHN-2026-00101", unique, indexed)
- `customer_id`: string (FK -> customers.id, indexed)
- `status`: string ("PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED")
- `payment_status`: string ("PENDING", "VERIFIED", "FAILED", "REFUNDED")
- `payment_method`: string ("COD", "MANUAL_UPI", "RAZORPAY")
- `payment_reference`: string (UTR number for UPI, or gateway payment ID)
- `subtotal_paisa`: integer
- `tax_paisa`: integer (GST calculation)
- `shipping_paisa`: integer
- `discount_paisa`: integer
- `total_paisa`: integer
- `currency`: string ("INR")
- `shipping_address`: string (JSON snapshot)
- `billing_address`: string (JSON snapshot)
- `delivery_instructions`: string
- `idempotency_key`: string (unique, indexed)
- `created_at`: string (ISO-8601 UTC)
- `updated_at`: string (ISO-8601 UTC)

### `order_items` (Immutable Snapshot)
- `id`: string
- `order_id`: string (FK -> orders.id, indexed)
- `product_id`: string (FK -> products.id, indexed)
- `product_name_snapshot`: string
- `sku_snapshot`: string
- `unit_price_paisa`: integer
- `quantity`: integer
- `subtotal_paisa`: integer
- `image_url_snapshot`: string
- `metadata_json`: string

### `shipments`
- `id`: string
- `order_id`: string (FK -> orders.id, indexed)
- `courier_name`: string (e.g. "BlueDart Express", "Delhivery Surface", "DTDC Priority")
- `tracking_number`: string (indexed)
- `tracking_url`: string
- `status`: string ("LABEL_CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "RTO")
- `dispatched_at`: string (ISO-8601 UTC)
- `estimated_delivery`: string (ISO-8601 UTC)
- `delivered_at`: string (ISO-8601 UTC)

### `coupons`
- `id`: string
- `code`: string (unique, uppercase, e.g. "MONSOON10")
- `discount_type`: string ("PERCENTAGE", "FIXED_AMOUNT")
- `discount_value`: integer (percent 1-100, or Paisa amount)
- `min_order_paisa`: integer
- `max_discount_paisa`: integer
- `max_uses`: integer
- `used_count`: integer
- `valid_from`: string (ISO-8601 UTC)
- `valid_until`: string (ISO-8601 UTC)
- `is_active`: boolean

### `store_settings`
- `key`: string (unique, primary key, e.g. "store_info", "upi_settings", "shipping_rules")
- `value_json`: string
- `updated_at`: string
