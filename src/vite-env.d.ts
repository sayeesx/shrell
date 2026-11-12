/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_APPWRITE_ENDPOINT?: string;
  readonly VITE_APPWRITE_PROJECT_ID?: string;
  readonly VITE_APPWRITE_DATABASE_ID?: string;
  readonly VITE_APPWRITE_BUCKET_ID?: string;
  readonly VITE_STORE_UPI_ID?: string;
  readonly VITE_STORE_UPI_NAME?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_WHATSAPP_SUPPORT_NUMBER?: string;
  readonly VITE_SHIPROCKET_EMAIL?: string;
  readonly VITE_SHIPROCKET_PASSWORD?: string;
  readonly VITE_FREE_SHIPPING_THRESHOLD_PAISA?: string;
  readonly VITE_STANDARD_SHIPPING_PAISA?: string;
  readonly VITE_GST_RATE_PERCENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'country-telephone-data' {
  export interface CountryDataItem {
    name: string;
    iso2: string;
    dialCode: string;
    priority: number;
    format?: string;
  }
  export const allCountries: CountryDataItem[];
}
