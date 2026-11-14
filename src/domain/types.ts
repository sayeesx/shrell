export type CurrencyCode = 'INR';

export type PaymentMethod = 'COD' | 'MANUAL_UPI' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ShipmentStatus = 'LABEL_CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RTO';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  countryOfOrigin: string;
}

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
  country: string;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  bodyType: 'SUV' | 'Sedan' | 'Hatchback' | 'Crossover';
}

export interface VehicleVariant {
  id: string;
  modelId: string;
  variantName: string;
  yearStart: number;
  yearEnd?: number; // undefined = present
}

export interface VehicleCompatibility {
  id: string;
  productId: string;
  modelId: string;
  variantId?: string;
  yearStart?: number;
  yearEnd?: number;
  notes?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductSpecification {
  group: string;
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  brandId: string;
  brandName?: string;
  pricePaisa: number; // Stored in integer Indian Paisa: ₹1.00 = 100
  compareAtPricePaisa?: number;
  costPricePaisa?: number;
  isUniversalFit: boolean;
  isActive: boolean;
  isFeatured: boolean;
  weightGrams: number;
  dimensionsCm: string; // e.g. "120x45x15"
  installationDifficulty: 'Plug & Play' | 'Moderate' | 'Professional Recommended';
  warrantyMonths: number;
  showTechnicalSpecs?: boolean;
  badge?: string;
  specifications: ProductSpecification[];
  images: ProductImage[];
  stockQuantity: number;
  compatibleVehicleCount?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPricePaisa: number;
  subtotalPaisa: number;
  selectedVariantId?: string;
}

export interface Cart {
  items: CartItem[];
  subtotalPaisa: number;
  discountPaisa: number;
  shippingPaisa: number;
  taxPaisa: number; // GST included in total or broken down
  totalPaisa: number;
  appliedCoupon?: Coupon;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  postalCode: string; // 6-digit Indian PIN code
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isGuest: boolean;
  totalOrders: number;
  totalSpentPaisa: number;
  addresses: CustomerAddress[];
  createdAt: string;
}

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPricePaisa: number;
  quantity: number;
  subtotalPaisa: number;
  imageUrl: string;
  specificationsSnapshot?: string;
}

export interface Order {
  id: string; // e.g. "VAHN-2026-00101"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string; // UTR for UPI or Razorpay Payment ID
  subtotalPaisa: number;
  taxPaisa: number;
  shippingPaisa: number;
  discountPaisa: number;
  totalPaisa: number;
  shippingAddress: CustomerAddress;
  deliveryInstructions?: string;
  items: OrderItemSnapshot[];
  shipment?: Shipment;
  internalNotes?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
  status: ShipmentStatus;
  dispatchedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  statusUpdates?: {
    timestamp: string;
    location: string;
    activity: string;
  }[];
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityChange: number;
  movementType: 'RESTOCK' | 'SALE' | 'RESERVATION' | 'CANCELLATION' | 'DAMAGE_ADJUSTMENT';
  referenceId: string;
  notes: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number; // Percentage (e.g. 10) or Paisa amount (e.g. 50000 = ₹500)
  minOrderPaisa: number;
  maxDiscountPaisa?: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappSupportNumber: string;
  storeUpiId: string;
  storeUpiName: string;
  freeShippingThresholdPaisa: number;
  standardShippingPaisa: number;
  gstRatePercent: number;
  currency: CurrencyCode;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageAlt?: string;
}

export interface HeroBanner {
  id: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  targetUrl: string; // e.g. "/catalogue" or "/catalogue?category=roof-racks-cargo"
  altText?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export type HomeSectionType =
  | 'PRODUCTS_GRID'
  | 'PRODUCTS_CAROUSEL'
  | 'CATEGORIES_GRID'
  | 'EDITORIAL_BENTO'
  | 'BANNER_PROMO';

export interface HomeSection {
  id: string;
  title: string;
  subtitle?: string;
  sectionType: HomeSectionType;
  displayOrder: number;
  isActive: boolean;
  categorySlug?: string;
  limit?: number;
  viewAllUrl?: string;
  customBannerUrl?: string;
  customBannerTargetUrl?: string;
  bentoConfig?: {
    highlightTitle?: string;
    highlightBadge?: string;
    card1Text?: string;
    card2Text?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId?: string;
  authorName: string;
  rating: number; // 1 to 5 integer
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>; // { 5: count, 4: count, 3: count, 2: count, 1: count }
}
