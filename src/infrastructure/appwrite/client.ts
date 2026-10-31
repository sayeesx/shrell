import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
export const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'vahn_ecommerce';
export const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'product_assets';

export const isAppwriteConfigured = Boolean(
  projectId && projectId !== 'your_appwrite_project_id' && projectId !== 'your_project_id'
);

export const client = new Client();

if (isAppwriteConfigured) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  INVENTORY: 'inventory',
  INVENTORY_MOVEMENTS: 'inventory_movements',
  VEHICLE_MAKES: 'vehicle_manufacturers',
  VEHICLE_MODELS: 'vehicle_models',
  VEHICLE_VARIANTS: 'vehicle_variants',
  VEHICLE_COMPATIBILITY: 'vehicle_compatibility',
  COUPONS: 'coupons',
  SETTINGS: 'store_settings',
  CUSTOMERS: 'customers',
  ADDRESSES: 'customer_addresses',
};
