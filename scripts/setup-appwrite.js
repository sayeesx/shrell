/**
 * VAHN AUTOMOTIVE - Appwrite Automated Database Provisioning & Seeding Script
 * Run with: node scripts/setup-appwrite.js
 */

import { Client, Databases, Storage, Permission, Role, ID } from 'node-appwrite';

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'vahn_ecommerce';
const bucketId = process.env.VITE_APPWRITE_BUCKET_ID || 'product_assets';

if (!projectId || !apiKey) {
  console.log(`
========================================================================
[NOTICE] Appwrite Setup Script
------------------------------------------------------------------------
To run automated provisioning against Appwrite Cloud:
Please set the following environment variables:
  APPWRITE_PROJECT_ID=your_appwrite_project_id
  APPWRITE_API_KEY=your_appwrite_secret_master_api_key

Your application is currently running with zero dependencies using the
built-in persistent LocalStorage & In-Memory Data Access Layer.
========================================================================
`);
  process.exit(0);
}

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function setup() {
  console.log(`Starting automated provisioning for database: ${databaseId}...`);

  try {
    // 1. Create Database if not exists
    try {
      await databases.get(databaseId);
      console.log(`Database "${databaseId}" already exists.`);
    } catch {
      await databases.create(databaseId, 'VAHN Automotive E-Commerce');
      console.log(`Created Database "${databaseId}".`);
    }

    // 2. Create Storage Bucket
    try {
      await storage.getBucket(bucketId);
      console.log(`Storage Bucket "${bucketId}" already exists.`);
    } catch {
      await storage.createBucket(
        bucketId,
        'VAHN Product Imagery & Technical Documents',
        [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.team('administrators'))],
        false,
        true,
        50000000, // 50MB
        ['jpg', 'jpeg', 'png', 'webp', 'avif', 'pdf']
      );
      console.log(`Created Storage Bucket "${bucketId}".`);
    }

    // 3. Define Collections & Permissions
    const collectionsToProvision = [
      { id: 'products', name: 'Products Catalogue', permissions: [Permission.read(Role.any()), Permission.write(Role.team('administrators'))] },
      { id: 'categories', name: 'Categories', permissions: [Permission.read(Role.any()), Permission.write(Role.team('administrators'))] },
      { id: 'brands', name: 'Brands', permissions: [Permission.read(Role.any()), Permission.write(Role.team('administrators'))] },
      { id: 'orders', name: 'Customer Orders', permissions: [Permission.create(Role.any()), Permission.read(Role.team('administrators'))] },
      { id: 'inventory', name: 'Inventory Levels', permissions: [Permission.read(Role.any()), Permission.write(Role.team('administrators'))] },
      { id: 'inventory_movements', name: 'Inventory Audit Movements', permissions: [Permission.read(Role.team('administrators')), Permission.write(Role.team('administrators'))] },
      { id: 'vehicle_manufacturers', name: 'Vehicle Manufacturers', permissions: [Permission.read(Role.any())] },
      { id: 'vehicle_models', name: 'Vehicle Models', permissions: [Permission.read(Role.any())] },
      { id: 'coupons', name: 'Discount Coupons', permissions: [Permission.read(Role.any()), Permission.write(Role.team('administrators'))] },
      { id: 'store_settings', name: 'Store Settings', permissions: [Permission.read(Role.any()), Permission.write(Role.team('administrators'))] },
    ];

    for (const col of collectionsToProvision) {
      try {
        await databases.getCollection(databaseId, col.id);
        console.log(`Collection "${col.id}" exists.`);
      } catch {
        await databases.createCollection(databaseId, col.id, col.name, col.permissions);
        console.log(`Created Collection "${col.id}".`);
      }
    }

    console.log('\n[SUCCESS] Appwrite schema and storage bucket provisioned successfully!');
  } catch (err) {
    console.error('Appwrite provisioning failed:', err);
  }
}

setup();
