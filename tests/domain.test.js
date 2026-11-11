import test from 'node:test';
import assert from 'node:assert/strict';

// Helper tests for Currency and Cart calculation
function paisaToRupees(paisa) {
  return Math.round(paisa) / 100;
}

function rupeesToPaisa(rupees) {
  return Math.round(rupees * 100);
}

function calculateCart(items, coupon, settings) {
  const subtotalPaisa = items.reduce((acc, item) => acc + item.unitPricePaisa * item.quantity, 0);

  let discountPaisa = 0;
  if (coupon && coupon.isActive && subtotalPaisa >= coupon.minOrderPaisa) {
    if (coupon.discountType === 'PERCENTAGE') {
      const calc = Math.round((subtotalPaisa * coupon.discountValue) / 100);
      discountPaisa = coupon.maxDiscountPaisa ? Math.min(calc, coupon.maxDiscountPaisa) : calc;
    } else {
      discountPaisa = Math.min(coupon.discountValue, subtotalPaisa);
    }
  }

  let shippingPaisa = 0;
  if (items.length > 0) {
    if (subtotalPaisa - discountPaisa >= settings.freeShippingThresholdPaisa) {
      shippingPaisa = 0;
    } else {
      shippingPaisa = settings.standardShippingPaisa;
    }
  }

  const taxable = Math.max(0, subtotalPaisa - discountPaisa);
  const taxPaisa = Math.round((taxable * settings.gstRatePercent) / (100 + settings.gstRatePercent));
  const totalPaisa = Math.max(0, subtotalPaisa - discountPaisa + shippingPaisa);

  return { subtotalPaisa, discountPaisa, shippingPaisa, taxPaisa, totalPaisa };
}

test('Currency Service: Integer Paisa to Rupee conversions avoid precision loss', () => {
  assert.equal(paisaToRupees(1499900), 14999);
  assert.equal(rupeesToPaisa(14999), 1499900);
  assert.equal(paisaToRupees(25050), 250.5);
  assert.equal(rupeesToPaisa(250.5), 25050);
});

test('Cart Calculation: Free Shipping Threshold applies correctly above ₹300', () => {
  const settings = {
    freeShippingThresholdPaisa: 30000, // ₹300.00
    standardShippingPaisa: 6000, // ₹60.00
    gstRatePercent: 18,
  };

  // Case 1: Order below threshold (₹250)
  const itemsBelow = [{ unitPricePaisa: 25000, quantity: 1 }];
  const cartBelow = calculateCart(itemsBelow, null, settings);
  assert.equal(cartBelow.subtotalPaisa, 25000);
  assert.equal(cartBelow.shippingPaisa, 6000, 'Orders under ₹300 should incur standard ₹60 shipping');
  assert.equal(cartBelow.totalPaisa, 31000);

  // Case 2: Order above threshold (₹500)
  const itemsAbove = [{ unitPricePaisa: 50000, quantity: 1 }];
  const cartAbove = calculateCart(itemsAbove, null, settings);
  assert.equal(cartAbove.subtotalPaisa, 50000);
  assert.equal(cartAbove.shippingPaisa, 0, 'Orders over ₹300 should have FREE shipping');
  assert.equal(cartAbove.totalPaisa, 50000);
});

test('Coupon Validation: Percentage discount with cap calculates accurately', () => {
  const settings = {
    freeShippingThresholdPaisa: 30000,
    standardShippingPaisa: 6000,
    gstRatePercent: 18,
  };

  const coupon = {
    code: 'VAHN10',
    discountType: 'PERCENTAGE',
    discountValue: 10, // 10%
    minOrderPaisa: 500000, // ₹5,000 min order
    maxDiscountPaisa: 150000, // ₹1,500 max cap
    isActive: true,
  };

  // Order of ₹20,000: 10% would be ₹2,000, but capped at ₹1,500
  const items = [{ unitPricePaisa: 2000000, quantity: 1 }];
  const cart = calculateCart(items, coupon, settings);

  assert.equal(cart.subtotalPaisa, 2000000);
  assert.equal(cart.discountPaisa, 150000, 'Discount must be capped at max discount ₹1,500');
  assert.equal(cart.shippingPaisa, 0);
  assert.equal(cart.totalPaisa, 1850000); // ₹20,000 - ₹1,500 = ₹18,500
});

test('Payment & Verification: Indian Mobile and PIN Code regex validations', () => {
  const isValidPhone = (p) => {
    const clean = p.replace(/[^0-9]/g, '').slice(-10);
    return /^[6-9]\d{9}$/.test(clean);
  };
  const isValidPin = (pin) => /^[1-9][0-9]{5}$/.test(pin.trim());
  const isValidUTR = (utr) => /^[0-9]{12}$/.test(utr.trim());

  assert.equal(isValidPhone('9820012345'), true);
  assert.equal(isValidPhone('+919820012345'), true);
  assert.equal(isValidPhone('12345'), false);

  assert.equal(isValidPin('411001'), true);
  assert.equal(isValidPin('110001'), true);
  assert.equal(isValidPin('011001'), false);
  assert.equal(isValidPin('41100'), false);

  assert.equal(isValidUTR('412389102938'), true);
  assert.equal(isValidUTR('1234'), false);
});

test('Product Reviews & Rating Calculation: Accurate average and star breakdown distribution', () => {
  const reviews = [
    { rating: 5 },
    { rating: 5 },
    { rating: 4 },
    { rating: 5 },
    { rating: 3 },
  ];

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    sum += r.rating;
  });

  const averageRating = Number((sum / reviews.length).toFixed(1));
  assert.equal(averageRating, 4.4);
  assert.equal(breakdown[5], 3);
  assert.equal(breakdown[4], 1);
  assert.equal(breakdown[3], 1);
  assert.equal(breakdown[2], 0);
  assert.equal(breakdown[1], 0);
  assert.equal(reviews.length, 5);
});
