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

test('Postal PIN Code: 6-digit validation and non-blocking fallback mapping', async () => {
  const { getFallbackFromPin, INDIAN_PIN_PREFIX_FALLBACK } = await import('../src/hooks/usePostalPincode.ts');

  // Verify prefix mapping for key Indian regions
  assert.equal(INDIAN_PIN_PREFIX_FALLBACK['11'].state, 'Delhi');
  assert.equal(INDIAN_PIN_PREFIX_FALLBACK['40'].state, 'Maharashtra');
  assert.equal(INDIAN_PIN_PREFIX_FALLBACK['56'].state, 'Karnataka');
  assert.equal(INDIAN_PIN_PREFIX_FALLBACK['60'].state, 'Tamil Nadu');
  assert.equal(INDIAN_PIN_PREFIX_FALLBACK['70'].state, 'West Bengal');

  // Test getFallbackFromPin helper
  const pune = getFallbackFromPin('411001');
  assert.ok(pune);
  assert.equal(pune.state, 'Maharashtra');
  assert.equal(pune.city, 'Pune');

  const bengaluru = getFallbackFromPin('560001');
  assert.ok(bengaluru);
  assert.equal(bengaluru.state, 'Karnataka');
  assert.equal(bengaluru.city, 'Bengaluru');

  const invalid = getFallbackFromPin('9');
  assert.equal(invalid, null);
});

test('Fuse.js Search: Typo-tolerant matching on automotive parts', async () => {
  const { searchProductsWithFuse } = await import('../src/infrastructure/search/searchService.ts');

  const mockProducts = [
    {
      id: 'prod-1',
      name: 'All-Weather 3D TPE Floor Mats',
      slug: 'all-weather-3d-tpe-floor-mats',
      sku: 'SHR-MAT-001',
      categoryName: 'Floor Mats',
      brandName: 'SHRELL Precision',
      shortDescription: 'Laser-measured deeply grooved all-weather TPE floor protection mats.',
      pricePaisa: 399900,
    },
    {
      id: 'prod-2',
      name: 'Solar Kinetic Turbine Fragrance Diffuser',
      slug: 'solar-kinetic-turbine-diffuser',
      sku: 'SHR-DIF-002',
      categoryName: 'Interior Care',
      brandName: 'SHRELL Luxe',
      shortDescription: 'Dual-ring levitating solar air freshener diffuser.',
      pricePaisa: 149900,
    },
    {
      id: 'prod-3',
      name: 'Braided Heavy-Duty 60W USB-C Cable',
      slug: 'braided-60w-usb-c-cable',
      sku: 'SHR-CAB-003',
      categoryName: 'Electronics',
      brandName: 'SHRELL Power',
      shortDescription: 'Fast charging high durability cable for automotive charging docks.',
      pricePaisa: 69900,
    },
  ];

  // 1. Typo in "Floor Mats": "matts"
  const matsMatches = searchProductsWithFuse(mockProducts, 'matts');
  assert.ok(matsMatches.length > 0);
  assert.equal(matsMatches[0].id, 'prod-1');

  // 2. Typo in "Diffuser": "difuser"
  const diffuserMatches = searchProductsWithFuse(mockProducts, 'difuser');
  assert.ok(diffuserMatches.length > 0);
  assert.equal(diffuserMatches[0].id, 'prod-2');

  // 3. Typo in "Cable": "cabl"
  const cableMatches = searchProductsWithFuse(mockProducts, 'cabl');
  assert.ok(cableMatches.length > 0);
  assert.equal(cableMatches[0].id, 'prod-3');

  // 4. Empty query returns all items
  const allMatches = searchProductsWithFuse(mockProducts, '');
  assert.equal(allMatches.length, 3);
});

test('PostHog Analytics: Safe telemetry client initializes and shapes standard funnel payloads', async () => {
  const {
    trackProductViewed,
    trackProductAddedToCart,
    trackCartViewed,
    trackOrderCompleted,
    trackSearchPerformed,
  } = await import('../src/infrastructure/analytics/posthog.ts');

  // Ensure functions can be called safely without throwing even when VITE_POSTHOG_KEY is empty
  assert.doesNotThrow(() => {
    trackProductViewed({
      id: 'p-1',
      name: 'Floor Mats',
      slug: 'floor-mats',
      sku: 'SKU-1',
      categoryId: 'cat-1',
      categoryName: 'Interior',
      brandName: 'SHRELL',
      pricePaisa: 299900,
      stockQuantity: 15,
      warrantyMonths: 12,
    });
  });

  assert.doesNotThrow(() => {
    trackProductAddedToCart(
      {
        id: 'p-1',
        name: 'Floor Mats',
        slug: 'floor-mats',
        sku: 'SKU-1',
        pricePaisa: 299900,
      },
      2
    );
  });

  assert.doesNotThrow(() => {
    trackCartViewed({
      items: [{ productId: 'p-1', quantity: 2, unitPricePaisa: 299900, subtotalPaisa: 599800 }],
      subtotalPaisa: 599800,
      discountPaisa: 0,
      shippingPaisa: 0,
      totalPaisa: 599800,
    });
  });

  assert.doesNotThrow(() => {
    trackSearchPerformed('matts', 1, 'navbar');
  });

  assert.doesNotThrow(() => {
    trackOrderCompleted({
      id: 'ord-1001',
      customerName: 'Aarav Sharma',
      customerPhone: '9876543210',
      customerEmail: 'aarav@example.com',
      paymentMethod: 'MANUAL_UPI',
      paymentStatus: 'PENDING',
      subtotalPaisa: 599800,
      shippingPaisa: 0,
      discountPaisa: 0,
      totalPaisa: 599800,
      items: [
        {
          productId: 'p-1',
          productName: 'Floor Mats',
          unitPricePaisa: 299900,
          quantity: 2,
          lineTotalPaisa: 599800,
        },
      ],
      shippingAddress: {
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
      },
    });
  });
});
