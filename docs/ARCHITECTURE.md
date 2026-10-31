# VAHN AUTOMOTIVE — SYSTEM ARCHITECTURE SPECIFICATION (ARCHITECTURE.md)

## 1. Architectural Philosophy

VAHN Automotive is architected as a **Modular Monolith** designed around Domain-Driven Design (DDD) and Hexagonal / Clean Architecture principles. 

While the initial system runs with zero fixed monthly infrastructure expenses (Appwrite Cloud free tier + Cloudflare Pages CDN & SSL), **zero business logic or presentation components are coupled to Appwrite or any external third-party vendor**.

```
+--------------------------------------------------------------------------+
|                     PRESENTATION LAYER (React 18 + TS)                  |
|    - Storefront Pages & Components (Catalog, Vehicle Compatibility, Cart) |
|    - Admin Dashboard (Orders, Inventory Movements, Product Management)    |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                    APPLICATION / DOMAIN SERVICE LAYER                   |
|    - Cart & Currency Engine (Integer Paisa / Minor Currency Units in INR)|
|    - Inventory Reservation & Atomic Deduction Logic                      |
|    - Order State Machine (Pending -> Confirmed -> Fulfilled -> Delivered)|
|    - Vehicle Compatibility Resolution Engine                             |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                        REPOSITORY INTERFACES                             |
|    IProductRepository  |  ICategoryRepository  |  IOrderRepository        |
|    IInventoryRepository|  ICustomerRepository  |  ISettingsRepository     |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                         INFRASTRUCTURE ADAPTERS                          |
|  +--------------------+  +--------------------+  +--------------------+  |
|  |  Appwrite Adapter  |  | In-Memory Adapter  |  | Future PostgreSQL  |  |
|  +--------------------+  +--------------------+  +--------------------+  |
|  +--------------------+  +--------------------+  +--------------------+  |
|  | Payment Adapters   |  | Shipping Adapters  |  | Storage Adapters   |  |
|  | - COD              |  | - Manual Courier   |  | - Appwrite Storage |  |
|  | - Manual UPI       |  | - Shiprocket API   |  | - Cloudflare R2    |  |
|  | - Razorpay (HMAC)  |  |                    |  |                    |  |
|  +--------------------+  +--------------------+  +--------------------+  |
+--------------------------------------------------------------------------+
```

---

## 2. Layer Responsibilities

### Presentation Layer (`src/pages`, `src/components`, `src/features`)
- Completely decoupled from database IDs, SDK clients, and raw network calls.
- Interacts exclusively with Domain Models, Services, and React Query Hooks wrapping Repository interfaces.
- Implements strict form validation via **Zod** schemas matching domain boundaries.

### Application & Domain Layer (`src/domain`, `src/application`)
- **Domain Models**: Immutable snapshots of core entities (`Product`, `Order`, `OrderItem`, `Vehicle`, `InventoryItem`).
- **Money Handling**: Stored in **integer minor units (Paisa)** to eradicate floating-point rounding errors. For example: `₹14,999.00` is represented as `1499900` paisa.
- **Order Snapshots**: When an order is placed, `order_items` stores an immutable snapshot of the product name, SKU, unit price, tax rate, and specs at that exact moment. Price updates in the catalog never mutate past orders.

### Repository Pattern (`src/infrastructure/repositories`)
- Concrete repository classes implement strongly-typed interfaces.
- The default factory dynamically injects either the **AppwriteRepository** (when environment variables are populated) or the **MockPersistenceRepository** (for local development, automated testing, or offline sandbox without network reliance).
- A future migration to PostgreSQL or Supabase requires writing one new adapter class implementing `IRepository<T>` without altering a single UI component.

### Payment Adapters (`src/infrastructure/payments`)
- **PaymentAdapter Interface**:
  - `initiatePayment(order: Order): Promise<PaymentSession>`
  - `verifyPayment(payload: PaymentVerificationDTO): Promise<PaymentVerificationResult>`
- **COD Adapter**: Auto-confirms order placement with status `PAYMENT_PENDING_COD`.
- **Manual UPI Adapter**: Generates dynamic UPI Intent string (`upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`), formats QR data, and tracks UTR (Unique Transaction Reference) submitted by the customer for admin manual verification.
- **Razorpay Adapter**: Pre-architected client-server flow utilizing server-side HMAC-SHA256 signature verification.

### Shipping Adapters (`src/infrastructure/shipping`)
- **ShippingAdapter Interface**:
  - `calculateRates(pincode: string, weightGrams: number): Promise<ShippingQuote>`
  - `createShipment(order: Order): Promise<ShipmentDetails>`
  - `trackShipment(trackingNumber: string): Promise<ShipmentTrackingTimeline>`
- **Manual Courier Adapter**: Full administrative management of courier name (BlueDart, Delhivery, DTDC, India Post), tracking AWB, tracking URL, and status events.
- **Shiprocket Adapter**: Clean API contract mapped to Shiprocket orders, pickup generation, and webhook ingestion.

---

## 3. Directory Layout

```text
src/
├── app/                  # Application bootstrap, providers, router
├── application/          # Use cases, cart calculations, order orchestration
├── components/           # Shared accessible UI components (inputs, modals, buttons)
├── domain/               # Domain models, enums, business rules, value objects
├── features/             # Feature slices:
│   ├── admin/            # Dashboard, inventory manager, orders, analytics
│   ├── auth/             # Login, register, admin auth guard
│   ├── catalog/          # Product list, filters, search, product detail
│   ├── checkout/         # Multi-step checkout, COD, UPI, address management
│   ├── compatibility/    # Vehicle selector, Make/Model/Year filter
│   ├── orders/           # Customer order tracking, invoice view
│   └── whatsapp/         # Floating support, cart-to-WhatsApp generator
├── infrastructure/       # Repository implementations & adapters
│   ├── appwrite/         # Appwrite SDK client & collection mappings
│   ├── payments/         # COD, UPI, Razorpay adapters
│   ├── repositories/     # Repository factories & implementations
│   └── shipping/         # Manual, Shiprocket adapters
├── schemas/              # Zod validation schemas
├── styles/               # Tailwind CSS directives, typography, design tokens
└── types/                # Global TypeScript definitions
```
