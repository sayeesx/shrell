# SHRELL

<p align="center">
  <img src="public/logos/shrell-brandicon_no-bg.png" alt="SHRELL Logo" width="80" height="80" />
</p>

<p align="center">
  Modular automotive e-commerce storefront and operations portal designed for performance vehicle accessories, touring gear, and precision interior enhancements in India.
</p>

<p align="center">
  <a href="https://github.com/sayeesx/shrell/actions/workflows/ci.yml"><img src="https://github.com/sayeesx/shrell/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white" alt="Node 22" />
</p>

---

## Architecture Overview

SHRELL is engineered as a modular monolith adhering to Domain-Driven Design (DDD) and Hexagonal Architecture principles. Presentation and business domain logic remain decoupled from external storage or identity providers through repository interfaces, supporting dual Supabase / Appwrite backends alongside an in-memory development fallback.

```
+-------------------------------------------------------------------------------+
|                      PRESENTATION LAYER (React 18 + TS)                       |
|   - Customer Storefront (Vehicle Fitment, Fuzzy Search, Cart, Express Checkout)  |
|   - Operations Portal (Live Metrics, Order Fulfilment, Inventory Audits)      |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                      APPLICATION / DOMAIN SERVICE LAYER                       |
|   - Currency Engine (Integer Paisa / Minor Units in INR - Zero Float Drift)   |
|   - Order State Machine (Pending -> Confirmed -> Shipped -> Delivered)       |
|   - Inventory Reservation & Atomic Deduction Workflows                        |
|   - Vehicle Fitment Resolution Matrix                                         |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                             REPOSITORY INTERFACES                             |
|     IProductRepository   |   ICategoryRepository   |   IOrderRepository       |
|     IInventoryRepository |   ICustomerRepository   |   ISettingsRepository    |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                            INFRASTRUCTURE ADAPTERS                            |
|   +--------------------+  +--------------------+  +--------------------+      |
|   |  Supabase Adapter  |  |  Appwrite Adapter  |  | In-Memory Fallback |      |
|   +--------------------+  +--------------------+  +--------------------+      |
|   +--------------------+  +--------------------+  +--------------------+      |
|   |  Payment Gateways  |  | Logistics Tracking |  | Media Delivery CDN |      |
|   |  - NPCI UPI (UTR)  |  | - BlueDart Express |  | - Cloudinary CDN   |      |
|   |  - Cash on Delivery|  | - Delhivery Surface|  | - Sanity Image CDN |      |
|   |  - Razorpay HMAC   |  | - DTDC Courier     |  |                    |      |
|   +--------------------+  +--------------------+  +--------------------+      |
+-------------------------------------------------------------------------------+
```

---

## Core Capabilities

### Storefront Experience
- **Vehicle Fitment Selector**: Filter components by vehicle Make, Model, Variant, and Year (Tata Safari, Harrier, Mahindra Scorpio-N, XUV700, Thar, Toyota Fortuner, VW Virtus, etc.), with fallback to universal fitment.
- **Integer Paisa Accounting**: All transaction calculations run strictly in integer minor units (1 INR = 100 Paisa), eliminating floating-point rounding errors.
- **Typo-Tolerant Search**: Fuzzy catalogue search powered by Fuse.js with real-time category, brand, price-range, and stock filters.
- **India & International Checkout**:
  - Strict 10-digit validation for Indian mobile numbers with automatic country code dial rules for international orders.
  - Automated Postal PIN Code auto-fill for Indian districts and states via postal API with non-blocking fallback.
  - Native NPCI UPI dynamic QR code and VPA copy action with 12-digit UTR receipt collection.
  - Cash on Delivery (COD) order placement and HMAC-signed Razorpay adapter hooks.
- **Cart & Abandonment Protection**: Persistent local cart synchronization, free express surface shipping threshold calculation, and exit-intent confirmation modals.

### Operations Portal (`/admin`)
- **Live Performance Dashboard**: Real-time gross revenue, order volume, average order value, pending dispatch counts, and stock threshold warnings.
- **Catalogue & Media Management**: Multi-image product gallery uploading with unsigned Cloudinary presets and WebP format enforcement.
- **Inventory Audit Trail**: Atomic stock deductions on checkout, manual adjustments (+ Restock / - Damage), and immutable movement audit logs.
- **Order Dispatch Pipeline**: Verify customer UPI UTR transaction references, assign courier Airway Bill (AWB) tracking numbers, and transition order lifecycle statuses.
- **Voucher Engine**: Create percentage and fixed discount vouchers with usage limits and minimum order thresholds.

---

## Repository Structure

```
shrell/
├── .github/
│   ├── ISSUE_TEMPLATE/        # Structured bug report and feature request templates
│   ├── workflows/ci.yml       # Automated GitHub Actions test & build pipeline
│   ├── dependabot.yml         # Weekly dependency vulnerability monitoring
│   └── pull_request_template.md
├── docs/                      # Technical specifications & architectural audits
│   ├── ANTI-SLOP-AUDIT.md     # Design token & interaction compliance audit
│   ├── ARCHITECTURE.md        # Modular monolith and DDD layer specification
│   ├── DATABASE.md            # Schema design, integer Paisa currency, attributes
│   ├── DEPLOYMENT.md          # Cloudflare Pages and Supabase deployment guide
│   ├── DESIGN.md              # Design system, obsidian dark surface, typography
│   ├── ENVIRONMENT.md         # Environment variables reference
│   ├── MIGRATION.md           # Database migration pathways
│   └── SECURITY.md            # Zero-secret bundle policy & input sanitization
├── public/                    # Static assets, SVG logos, brand icons, feeds
├── scripts/                   # Automated sitemap and Google Merchant feed generators
├── src/
│   ├── application/           # Context providers (Cart, Auth, Theme)
│   ├── components/            # UI components (Storefront, Admin, Checkout, Modals)
│   ├── domain/                # Business entities, types, and validation rules
│   ├── hooks/                 # Custom React hooks (PIN code, media queries, debounce)
│   ├── infrastructure/        # Supabase, Appwrite, Analytics, and API clients
│   ├── pages/                 # Route entry points (Storefront, Admin, Checkout)
│   ├── styles/                # Tailwind CSS layers and brand palettes
│   └── utils/                 # Formatting helpers, phone rules, and search engines
├── tests/                     # Automated unit and integration test suite
├── .env.example               # Environment variables template
└── vite.config.ts             # Vite build configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.0.0` or higher (`v22.x` recommended)
- **npm**: `v10.0.0` or higher

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sayeesx/shrell.git
   cd shrell
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your Supabase or Cloudinary credentials, or leave defaults for local mock mode.*

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The storefront runs at `http://localhost:5173/`.  
   The administration dashboard runs at `http://localhost:5173/admin`.

---

## Testing & Quality Assurance

SHRELL includes a test suite using the built-in Node.js test runner:

```bash
# Execute test suite
npm test
```

The test runner validates:
- Integer Paisa to Rupee calculations and zero-float precision invariants.
- Dynamic cart thresholds and free shipping triggers.
- Coupon percentage discount caps and order value constraints.
- Indian mobile (10-digit) and postal PIN code (6-digit) validation logic.
- Product review aggregates and star distribution math.
- Typo-tolerant fuzzy matching across vehicle accessories.
- PostHog telemetry payload sanitation.
- Cloudinary HTTPS asset enforcement and allowed format filtering.

---

## Production Build

To build the client bundle and compile feeds:

```bash
npm run build
```

This automated step:
1. Generates `public/sitemap.xml` and mirrors to `dist/sitemap.xml`.
2. Compiles `public/merchant-feed.xml` for Google Merchant Center.
3. Performs TypeScript type checking (`tsc`).
4. Bundles minified assets via Vite (`vite build`).

---

## Technical Documentation

Detailed architectural and design specifications are maintained in the [`docs/`](docs/) directory:

- [System Architecture](docs/ARCHITECTURE.md) &mdash; Layer boundaries, interfaces, and adapter contracts.
- [Design Direction & Specification](docs/DESIGN.md) &mdash; Obsidian canvas system, typography hierarchy, and WCAG AA contrast specs.
- [Database Specification](docs/DATABASE.md) &mdash; Integer currency definitions, collection schemas, and index strategies.
- [Security Guidelines](docs/SECURITY.md) &mdash; Client bundle hygiene, input sanitization, and signature verification.
- [Deployment Guide](docs/DEPLOYMENT.md) &mdash; Cloudflare Pages build configuration and edge delivery.
- [Environment Configuration](docs/ENVIRONMENT.md) &mdash; Complete documentation of all `.env` options.
- [Migration Guide](docs/MIGRATION.md) &mdash; Database and storage migration pathways.
- [Anti-Slop Compliance Audit](docs/ANTI-SLOP-AUDIT.md) &mdash; Interaction, copy, and layout standards verification.

---

## License

Private repository. All rights reserved. &copy; SHRELL Automotive.
