# VAHN AUTOMOTIVE — SECURITY SPECIFICATION (SECURITY.md)

## 1. Zero Secrets in Client Bundles
- Under no circumstances are Appwrite API Master Keys (`APPWRITE_API_KEY`), Razorpay Key Secrets, or Shiprocket API Passwords bundled into the client Vite code.
- Client applications utilize only public environment variables prefixed with `VITE_` (`VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_RAZORPAY_KEY_ID`).
- Administrative actions requiring high-privilege permissions (e.g. bulk stock overrides, payment reconciliation webhooks) are executed either via protected Appwrite Serverless Functions or verified server-side calls.

---

## 2. Authentication & Authorization Separation

- **Customer Scope**: Customers authenticate using Appwrite Account Sessions (Email/Password or Phone OTP). Customers are only granted read/write permissions to their own documents (`user:[USER_ID]`).
- **Admin Scope**: Administrators belong to a dedicated Appwrite Team (`team:administrators`) or have explicit administrative custom claims. Admin route guards verify administrative session tokens before rendering sensitive views.
- **Guest Checkout**: Guest orders are created using restricted client permissions that allow creating an order record without granting public read access to other customers' order lists.

---

## 3. Financial Integrity & Fraud Prevention

- **Server-Side Order Calculation**: The client never determines or submits an arbitrary order total to the database. The total amount is calculated by summing immutable snapshot prices, adding configured tax, adding calculated shipping, and subtracting valid coupon discounts.
- **Idempotency Protection**: Every checkout submission generates a unique UUID `idempotency_key`. The backend checks for existing orders with that key before allocating inventory or creating records, preventing duplicate charges upon network hiccups.
- **Atomic Stock Reservation**: Inventory checkouts decrement available stock atomically. When quantity reaches zero, further checkouts fail with an out-of-stock validation error.
- **Payment Verification**: Manual UPI payments require human administrator verification of the submitted UTR (Unique Transaction Reference) number against bank statements before moving order status to `CONFIRMED`.

---

## 4. Input Sanitization & Validation

- All incoming payload data is strictly validated using **Zod** schemas before execution.
- Text inputs (shipping addresses, customer names, notes) are sanitized against XSS attacks.
- PIN codes are validated against the standard 6-digit Indian Postal Code regex `^[1-9][0-9]{5}$`.
- Phone numbers are validated against the E.164 / Indian mobile format `^(?:\+91|0)?[6-9]\d{9}$`.
