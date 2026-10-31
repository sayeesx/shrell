import { Cart, CartItem, Coupon, StoreSettings } from '../types';

export function calculateCart(
  items: CartItem[],
  coupon: Coupon | null | undefined,
  settings: StoreSettings
): Cart {
  // 1. Calculate items subtotal
  const subtotalPaisa = items.reduce((acc, item) => {
    return acc + item.unitPricePaisa * item.quantity;
  }, 0);

  // 2. Calculate coupon discount if eligible
  let discountPaisa = 0;
  if (coupon && coupon.isActive && subtotalPaisa >= coupon.minOrderPaisa) {
    if (coupon.discountType === 'PERCENTAGE') {
      const calculated = Math.round((subtotalPaisa * coupon.discountValue) / 100);
      discountPaisa = coupon.maxDiscountPaisa
        ? Math.min(calculated, coupon.maxDiscountPaisa)
        : calculated;
    } else {
      discountPaisa = Math.min(coupon.discountValue, subtotalPaisa);
    }
  }

  // 3. Calculate shipping based on free threshold
  let shippingPaisa = 0;
  if (items.length > 0) {
    if (subtotalPaisa - discountPaisa >= settings.freeShippingThresholdPaisa) {
      shippingPaisa = 0;
    } else {
      shippingPaisa = settings.standardShippingPaisa;
    }
  }

  // 4. Calculate included GST
  const taxableAmount = Math.max(0, subtotalPaisa - discountPaisa);
  const taxPaisa = Math.round((taxableAmount * settings.gstRatePercent) / (100 + settings.gstRatePercent));

  // 5. Total payable in Paisa
  const totalPaisa = Math.max(0, subtotalPaisa - discountPaisa + shippingPaisa);

  return {
    items,
    subtotalPaisa,
    discountPaisa,
    shippingPaisa,
    taxPaisa,
    totalPaisa,
    appliedCoupon: coupon || undefined,
  };
}
