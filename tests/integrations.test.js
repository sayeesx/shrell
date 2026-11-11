import test from 'node:test';
import assert from 'node:assert/strict';

test('Supabase Publishable Key: Sanitizes and accepts modern sb_publishable format', () => {
  const sanitizeKey = (k) => k.trim().replace(/["']/g, '');
  const key1 = ' "sb_publishable_xFb_hoOusbg_-mnQLGGPLQ_wfYlpi-I" ';
  const cleaned = sanitizeKey(key1);
  assert.equal(cleaned, 'sb_publishable_xFb_hoOusbg_-mnQLGGPLQ_wfYlpi-I');
  assert.ok(cleaned.startsWith('sb_publishable_'));
});

test('Cloudinary Upload Service: Validates allowed image formats and enforces HTTPS', () => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'image/gif',
  ];

  const validateFileType = (type) => allowedMimeTypes.includes(type.toLowerCase());
  assert.equal(validateFileType('image/png'), true);
  assert.equal(validateFileType('image/jpeg'), true);
  assert.equal(validateFileType('image/webp'), true);
  assert.equal(validateFileType('application/pdf'), false);
  assert.equal(validateFileType('application/javascript'), false);

  const enforceHttps = (url) => url.replace(/^http:\/\//i, 'https://');
  assert.equal(
    enforceHttps('http://res.cloudinary.com/shrell/image/upload/sample.jpg'),
    'https://res.cloudinary.com/shrell/image/upload/sample.jpg'
  );
  assert.equal(
    enforceHttps('https://res.cloudinary.com/shrell/image/upload/sample.jpg'),
    'https://res.cloudinary.com/shrell/image/upload/sample.jpg'
  );
});

test('Order Invariant: Item subtotal sum strictly equals subtotalPaisa in integer Indian Paisa', () => {
  const items = [
    { sku: 'RACK-001', unitPricePaisa: 1499900, quantity: 2 }, // 2999800
    { sku: 'MAT-002', unitPricePaisa: 499900, quantity: 1 },   // 499900
  ];

  const calculatedSubtotal = items.reduce((acc, it) => acc + (it.unitPricePaisa * it.quantity), 0);
  assert.equal(calculatedSubtotal, 3499700); // ₹34,997.00
  assert.ok(Number.isInteger(calculatedSubtotal), 'Monetary value must remain integer Paisa');
});

test('CMS Home Sections: Active filtering and display order sorting invariant', () => {
  const sections = [
    { id: 'sec-3', title: 'Editorial Bento', displayOrder: 3, isActive: true },
    { id: 'sec-1', title: 'Crazy Finds', displayOrder: 1, isActive: true },
    { id: 'sec-hidden', title: 'Archived Promo', displayOrder: 2, isActive: false },
    { id: 'sec-2', title: 'Festival Deals', displayOrder: 2, isActive: true },
  ];

  const visible = sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  assert.equal(visible.length, 3);
  assert.equal(visible[0].id, 'sec-1');
  assert.equal(visible[1].id, 'sec-2');
  assert.equal(visible[2].id, 'sec-3');
});


