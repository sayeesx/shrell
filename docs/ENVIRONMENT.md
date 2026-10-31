# VAHN AUTOMOTIVE — ENVIRONMENT CONFIGURATION (ENVIRONMENT.md)

## Environment Variables Reference

| Variable | Scope | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `VITE_APP_NAME` | Client | Store brand name | `VAHN Automotive` |
| `VITE_APP_URL` | Client | Storefront URL | `https://vahnautomotive.com` |
| `VITE_APPWRITE_ENDPOINT` | Client | Appwrite API URL | `https://cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Client | Appwrite Project ID | `vahn-automotive` |
| `VITE_APPWRITE_DATABASE_ID` | Client | Appwrite Database ID | `vahn_ecommerce` |
| `VITE_APPWRITE_BUCKET_ID` | Client | Appwrite Storage Bucket ID | `product_assets` |
| `VITE_STORE_UPI_ID` | Client | Indian UPI VPA for payments | `vahnautomotive@okhdfcbank` |
| `VITE_STORE_UPI_NAME` | Client | Registered Merchant Name | `VAHN Automotive India` |
| `VITE_WHATSAPP_SUPPORT_NUMBER` | Client | WhatsApp Click-to-Chat (E.164 without +) | `919876543210` |
| `VITE_FREE_SHIPPING_THRESHOLD_PAISA` | Client | Free shipping threshold (Paisa) | `499900` (₹4,999.00) |
| `VITE_STANDARD_SHIPPING_PAISA` | Client | Standard flat shipping rate | `25000` (₹250.00) |
| `VITE_GST_RATE_PERCENT` | Client | Applicable GST rate | `18` |
| `APPWRITE_API_KEY` | Server / Scripts | Secret Master API Key for migrations | *(Never expose in client)* |
