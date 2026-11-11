import posthog from 'posthog-js';
import type { Product, Cart, Order } from '../../domain/types.ts';

const safeEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? (process.env as Record<string, string | undefined>)
    : {};

export const POSTHOG_CONFIG = {
  apiKey: safeEnv.VITE_POSTHOG_KEY || '',
  apiHost: safeEnv.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
};

let isPostHogInitialized = false;

/**
 * Initializes PostHog for the client-side SPA.
 * Operates gracefully as a safe stub if VITE_POSTHOG_KEY is not defined.
 */
export function initPostHog(): void {
  if (typeof window === 'undefined' || isPostHogInitialized) return;

  const { apiKey, apiHost } = POSTHOG_CONFIG;

  if (apiKey && apiKey.trim() !== '') {
    try {
      posthog.init(apiKey, {
        api_host: apiHost,
        person_profiles: 'identified_only',
        capture_pageview: false, // Dispatched explicitly per React Router navigation
        capture_pageleave: true,
        autocapture: false, // Explicit, clean funnel tracking
        disable_session_recording: false,
        persistence: 'localStorage+cookie',
      });
      isPostHogInitialized = true;
    } catch (err) {
      console.warn('[PostHog] Initialization error:', err);
    }
  }
}

/**
 * Safe capture wrapper. Never throws or breaks execution if telemetry is offline or disabled.
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  try {
    if (POSTHOG_CONFIG.apiKey) {
      posthog.capture(eventName, properties);
    }
  } catch (err) {
    console.warn(`[PostHog] Failed to track ${eventName}:`, err);
  }
}

/* =========================================================================
   STANDARD E-COMMERCE FUNNEL EVENT TRACKERS
   ========================================================================= */

/**
 * 1. SPA Route Pageview
 */
export function trackPageView(path: string, pageTitle?: string): void {
  trackEvent('$pageview', {
    $current_url: typeof window !== 'undefined' ? window.location.href : path,
    path,
    title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
  });
}

/**
 * 2. Product Detail Viewed
 */
export function trackProductViewed(product: Product): void {
  trackEvent('product_viewed', {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    sku: product.sku,
    category_id: product.categoryId,
    category_name: product.categoryName || '',
    brand_name: product.brandName || '',
    price_paisa: product.pricePaisa,
    price_inr: product.pricePaisa / 100,
    stock_quantity: product.stockQuantity,
    in_stock: product.stockQuantity > 0,
    warranty_months: product.warrantyMonths,
  });
}

/**
 * 3. Product Added to Cart
 */
export function trackProductAddedToCart(product: Product, quantity = 1): void {
  trackEvent('product_added_to_cart', {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    sku: product.sku,
    category_name: product.categoryName || '',
    price_paisa: product.pricePaisa,
    price_inr: product.pricePaisa / 100,
    quantity,
    value_paisa: product.pricePaisa * quantity,
    value_inr: (product.pricePaisa * quantity) / 100,
  });
}

/**
 * 4. Product Removed from Cart
 */
export function trackProductRemovedFromCart(
  productId: string,
  productName: string,
  pricePaisa: number,
  quantity = 1
): void {
  trackEvent('product_removed_from_cart', {
    product_id: productId,
    product_name: productName,
    price_paisa: pricePaisa,
    price_inr: pricePaisa / 100,
    quantity,
  });
}

/**
 * 5. Cart Viewed
 */
export function trackCartViewed(cart: Cart): void {
  trackEvent('cart_viewed', {
    item_count: cart.items.length,
    total_quantity: cart.items.reduce((s, i) => s + i.quantity, 0),
    subtotal_paisa: cart.subtotalPaisa,
    subtotal_inr: cart.subtotalPaisa / 100,
    discount_paisa: cart.discountPaisa,
    shipping_paisa: cart.shippingPaisa,
    total_paisa: cart.totalPaisa,
    total_inr: cart.totalPaisa / 100,
    coupon_code: cart.appliedCoupon?.code || null,
  });
}

/**
 * 6. Checkout Started (Funnel Stage: Address / Initiate)
 */
export function trackCheckoutStarted(cart: Cart, step = 'address'): void {
  trackEvent('checkout_started', {
    step,
    item_count: cart.items.length,
    total_paisa: cart.totalPaisa,
    total_inr: cart.totalPaisa / 100,
    shipping_paisa: cart.shippingPaisa,
    coupon_code: cart.appliedCoupon?.code || null,
  });
}

/**
 * 7. Checkout Step Completed (Address saved, Payment chosen)
 */
export function trackCheckoutStepCompleted(step: string, properties?: Record<string, any>): void {
  trackEvent('checkout_step_completed', {
    step,
    ...properties,
  });
}

/**
 * 8. Payment Attempted (Razorpay, Direct UPI, COD)
 */
export function trackPaymentAttempted(paymentMethod: string, amountPaisa: number): void {
  trackEvent('payment_attempted', {
    payment_method: paymentMethod,
    amount_paisa: amountPaisa,
    amount_inr: amountPaisa / 100,
  });
}

/**
 * 9. Order Completed (Purchase Conversion)
 */
export function trackOrderCompleted(order: Order): void {
  trackEvent('order_completed', {
    order_id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    subtotal_paisa: order.subtotalPaisa,
    shipping_paisa: order.shippingPaisa,
    discount_paisa: order.discountPaisa,
    total_paisa: order.totalPaisa,
    total_inr: order.totalPaisa / 100,
    item_count: order.items.length,
    items: order.items.map((i) => ({
      product_id: i.productId,
      product_name: i.productName,
      unit_price_paisa: i.unitPricePaisa,
      quantity: i.quantity,
      line_total_paisa: i.subtotalPaisa,
    })),
    shipping_city: order.shippingAddress.city,
    shipping_state: order.shippingAddress.state,
    shipping_pincode: order.shippingAddress.postalCode,
  });
}

/**
 * 10. Coupon Applied
 */
export function trackCouponApplied(
  code: string,
  discountPaisa: number,
  success: boolean,
  reason?: string
): void {
  trackEvent('coupon_applied', {
    coupon_code: code,
    discount_paisa: discountPaisa,
    discount_inr: discountPaisa / 100,
    success,
    reason: reason || null,
  });
}

/**
 * 11. Search Performed (Typo-Tolerant Search Query)
 */
export function trackSearchPerformed(
  query: string,
  resultsCount: number,
  source: 'navbar' | 'catalogue'
): void {
  trackEvent('search_performed', {
    search_query: query,
    results_count: resultsCount,
    source,
  });
}

/**
 * 12. User Identity on Auth
 */
export function identifyUser(userId: string, traits?: Record<string, any>): void {
  try {
    if (POSTHOG_CONFIG.apiKey) {
      posthog.identify(userId, traits);
    }
  } catch (err) {
    console.warn('[PostHog] Identify error:', err);
  }
}

/**
 * 13. User Reset on Logout
 */
export function resetUser(): void {
  try {
    if (POSTHOG_CONFIG.apiKey) {
      posthog.reset();
    }
  } catch (err) {
    console.warn('[PostHog] Reset error:', err);
  }
}

export { posthog };
