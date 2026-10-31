# shrell

A production-oriented, modular ecommerce platform for SHRELL Automotive accessories operating in India.

Built with **zero fixed monthly infrastructure expenses** (Appwrite Cloud Free Tier + Cloudflare Pages Free Tier), strict clean architecture, and decoupled provider adapters designed for future migration to PostgreSQL and self-hosted infrastructure without rewriting business logic.

---

## 1. Key Business & Engineering Features

### Customer Storefront
- **Disciplined Automotive Aesthetics**: Deep technical obsidian canvas (`#0B0D11`), technical hairline borders, zero AI-slop gradients or glassmorphism abuse.
- **Vehicle Fitment Selector Engine**: Select vehicle manufacturer (Make), Model, Variant, and Year (e.g. Tata Safari, Harrier, Mahindra Scorpio-N, XUV700, Thar, Toyota Fortuner, VW Virtus). Real-time catalogue filtering by vehicle compatibility or universal fit.
- **Catalogue & Search**: Category filtering, brand selection, price range sliders, in-stock only toggle, sorting, and live keyword search.
- **Technical Product Data Sheet**: High-resolution image galleries, SKU metadata, integer Paisa currency handling, 18% GST breakdown, installation difficulty ratings, and vehicle fitment matrix.
- **Persistent Cart & Promotion Vouchers**: Client and local storage synchronization, live coupon validation with min-order thresholds (e.g., `VAHN10`, `EXPEDITION500`), and free express shipping threshold indicator (> ₹4,999.00).
- **Express Indian Checkout**:
  - Validates 10-digit Indian mobile numbers and 6-digit Postal PIN codes.
  - **Direct Bank UPI Transfer**: Standard NPCI UPI URI generation, copyable merchant VPA, dynamic order amount, and 12-digit UTR receipt collection.
  - **Cash on Delivery (COD)**: Real order queueing with courier collection handover.
  - **Razorpay Adapter**: Pre-architected client-server flow with server-side HMAC-SHA256 signature verification.
- **Consignment Tracking**: Look up real order statuses (Pending, Confirmed, Shipped, Delivered) and tracking links for BlueDart Express, Delhivery Surface, and DTDC.
- **Zero-Cost WhatsApp Assistant**: Prefilled technical inquiry and cart-to-WhatsApp deep links without requiring paid WhatsApp Business API subscriptions.

### Administrative Operations Portal (`/admin`)
- **Protected Access**: Route guard requiring passkey authentication (development key: `vahnadmin2026`).
- **Real-Time Operational Analytics**: Live gross revenue, total orders, average order value, pending dispatch count, and low-stock alerts computed directly from database records.
- **Product Management**: Create, edit, delete, and adjust catalogue inventory, cost prices, selling prices, and specifications.
- **Inventory & Movements Audit Trail**: Atomic stock deductions, manual stock adjustments (+ Restock / - Damage), and immutable movement audit logs.
- **Order Fulfilment & Dispatch**: Review consignee addresses, verify customer UPI UTR transaction references, assign courier airway bill (AWB) numbers, and transition order lifecycle statuses.
- **Promotions Engine**: Create percentage and fixed discount vouchers with usage limits and minimum order values.
- **Commerce Configuration**: Configure store contact information, WhatsApp desk number, store UPI VPA, free shipping thresholds, and GST tax percentages.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router v6, TanStack Query.
- **Backend / Data Layer**: Appwrite Cloud (Databases, Auth, Storage, Functions) + In-Memory/LocalStorage persistence fallback.
- **Testing**: Built-in Node test runner (`node --test tests/**/*.test.js`).
- **Hosting**: Cloudflare Pages (Free global CDN, SSL, HTTP/3, unlimited bandwidth).

---

## 3. Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node 22 / npm 11)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd ecommerce

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit the storefront at `http://localhost:5173/`.  
Access the administrative portal at `http://localhost:5173/admin` (Passkey: `vahnadmin2026`).

### Running Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 4. Documentation Directory

- [docs/DESIGN.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/DESIGN.md): Visual design system, Anti-Slop dials, typography, and contrast verification.
- [docs/ARCHITECTURE.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/ARCHITECTURE.md): Modular monolith, DDD layers, repository interfaces, and adapter contracts.
- [docs/DATABASE.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/DATABASE.md): Relational schema specification, integer currency units (Paisa), and collection attributes.
- [docs/SECURITY.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/SECURITY.md): Zero secrets in client bundles, idempotency protection, input sanitization.
- [docs/DEPLOYMENT.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/DEPLOYMENT.md): Cloudflare Pages and Appwrite Cloud step-by-step production deployment.
- [docs/MIGRATION.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/MIGRATION.md): Pathways for moving to self-hosted Appwrite, PostgreSQL, or Cloudflare R2 storage.
- [docs/ENVIRONMENT.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/ENVIRONMENT.md): Complete environment variables reference.
- [docs/ANTI-SLOP-AUDIT.md](file:///c:/Users/unknown%20user/OneDrive/Desktop/Projects/ecommerce/docs/ANTI-SLOP-AUDIT.md): 100% compliance audit report across rules R-01 through R-40.
